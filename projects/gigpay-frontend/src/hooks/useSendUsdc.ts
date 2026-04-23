import { useCallback, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'

const USDC_ASSET_ID = Number(import.meta.env.VITE_USDC_ASSET_ID) || 0

export function useSendUsdc() {
  const { activeAddress, transactionSigner } = useWallet()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txId, setTxId] = useState<string | null>(null)

  const send = useCallback(
    async (recipient: string, amountMicroUsdc: number) => {
      setError(null)
      setTxId(null)

      if (!activeAddress) {
        setError('Wallet not connected')
        return false
      }

      if (!algosdk.isValidAddress(recipient)) {
        setError('Invalid Algorand address')
        return false
      }

      if (recipient === activeAddress) {
        setError('Cannot send to yourself')
        return false
      }

      if (amountMicroUsdc <= 0) {
        setError('Amount must be greater than 0')
        return false
      }

      setSending(true)
      try {
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        algorand.setDefaultSigner(transactionSigner)

        const result = await algorand.send.assetTransfer({
          sender: activeAddress,
          receiver: recipient,
          assetId: BigInt(USDC_ASSET_ID),
          amount: BigInt(amountMicroUsdc),
        })

        setTxId(result.txIds[0])
        return true
      } catch (err: any) {
        const msg = err?.message || 'Transaction failed'
        if (msg.includes('rejected')) {
          setError('Transaction rejected by wallet')
        } else if (msg.includes('underflow') || msg.includes('below min')) {
          setError('Insufficient USDC balance')
        } else {
          setError(msg.length > 100 ? msg.slice(0, 100) + '...' : msg)
        }
        return false
      } finally {
        setSending(false)
      }
    },
    [activeAddress, transactionSigner],
  )

  const reset = useCallback(() => {
    setError(null)
    setTxId(null)
  }, [])

  return { send, sending, error, txId, reset }
}
