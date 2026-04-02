import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { EscrowPoolClient } from '../contracts/EscrowPool'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { useCallback, useState } from 'react'
import algosdk from 'algosdk'

const ESCROW_APP_ID = Number(import.meta.env.VITE_ESCROW_APP_ID) || 0

export function useEscrowPool() {
  const { activeAddress, transactionSigner } = useWallet()
  const [loading, setLoading] = useState(false)

  const getAlgorand = useCallback(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
    algorand.setDefaultSigner(transactionSigner)
    return algorand
  }, [transactionSigner])

  const getClient = useCallback((): EscrowPoolClient | null => {
    if (!activeAddress || !ESCROW_APP_ID) return null
    const algorand = getAlgorand()
    return new EscrowPoolClient({
      appId: BigInt(ESCROW_APP_ID),
      algorand,
      defaultSender: activeAddress,
    })
  }, [activeAddress, getAlgorand])

  const getBalance = useCallback(async (): Promise<number> => {
    const client = getClient()
    if (!client) return 0
    try {
      const result = await client
        .newGroup()
        .getBalance()
        .simulate({ allowUnnamedResources: true, skipSignatures: true })
      return Number(result.returns[0] || 0)
    } catch {
      return 0
    }
  }, [getClient])

  const depositFunds = useCallback(
    async (usdcAssetId: number, amount: number) => {
      const client = getClient()
      if (!client) throw new Error('Not connected')
      setLoading(true)
      try {
        const algorand = getAlgorand()
        const axfer = await algorand.createTransaction.assetTransfer({
          sender: activeAddress!,
          receiver: client.appClient.appAddress,
          assetId: BigInt(usdcAssetId),
          amount: BigInt(amount),
        })
        await client.send.depositFunds({ args: { payment: axfer, amount } })
      } finally {
        setLoading(false)
      }
    },
    [getClient, getAlgorand, activeAddress],
  )

  const releasePayment = useCallback(
    async (workerAddress: string, amount: number, deliveryId: number) => {
      const client = getClient()
      if (!client) throw new Error('Not connected')
      setLoading(true)
      try {
        const workerBytes = algosdk.decodeAddress(workerAddress).publicKey
        const idBytes = new Uint8Array(8)
        new DataView(idBytes.buffer).setBigUint64(0, BigInt(deliveryId))

        await client.send.releasePayment({
          args: { worker: workerAddress, amount, deliveryId },
          extraFee: AlgoAmount.MicroAlgo(1000),
          boxReferences: [
            {
              appId: BigInt(ESCROW_APP_ID),
              name: new Uint8Array([...new TextEncoder().encode('pay_'), ...workerBytes, ...idBytes]),
            },
          ],
        })
      } finally {
        setLoading(false)
      }
    },
    [getClient],
  )

  return { getBalance, depositFunds, releasePayment, loading, appId: ESCROW_APP_ID }
}
