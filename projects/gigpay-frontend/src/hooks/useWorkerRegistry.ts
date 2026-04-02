import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient, microAlgo } from '@algorandfoundation/algokit-utils'
import { WorkerRegistryClient } from '../contracts/WorkerRegistry'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { useCallback, useState } from 'react'
import algosdk from 'algosdk'

const REGISTRY_APP_ID = Number(import.meta.env.VITE_REGISTRY_APP_ID) || 0

export function useWorkerRegistry() {
  const { activeAddress, transactionSigner } = useWallet()
  const [loading, setLoading] = useState(false)

  const getAlgorand = useCallback(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
    algorand.setDefaultSigner(transactionSigner)
    return algorand
  }, [transactionSigner])

  const getClient = useCallback((): WorkerRegistryClient | null => {
    if (!activeAddress || !REGISTRY_APP_ID) return null
    const algorand = getAlgorand()
    return new WorkerRegistryClient({
      appId: BigInt(REGISTRY_APP_ID),
      algorand,
      defaultSender: activeAddress,
    })
  }, [activeAddress, getAlgorand])

  const addWorker = useCallback(
    async (workerAddress: string, name: string, phone: string, upiId: string, rating: number) => {
      const client = getClient()
      if (!client) throw new Error('Not connected')
      setLoading(true)
      try {
        const algorand = getAlgorand()
        const mbrPay = await algorand.createTransaction.payment({
          sender: activeAddress!,
          receiver: client.appClient.appAddress,
          amount: microAlgo(100_000),
        })

        const workerBytes = algosdk.decodeAddress(workerAddress).publicKey
        const nameBytes = new TextEncoder().encode(name)
        const phoneBytes = new TextEncoder().encode(phone)
        const upiBytes = new TextEncoder().encode(upiId)

        await client.send.addWorker({
          args: {
            worker: workerAddress,
            name: nameBytes,
            phone: phoneBytes,
            upiId: upiBytes,
            rating,
            mbrPay,
          },
          boxReferences: [
            {
              appId: BigInt(REGISTRY_APP_ID),
              name: new Uint8Array([...new TextEncoder().encode('wrk_'), ...workerBytes]),
            },
          ],
        })
      } finally {
        setLoading(false)
      }
    },
    [getClient, getAlgorand, activeAddress],
  )

  const updateRating = useCallback(
    async (workerAddress: string, newRating: number) => {
      const client = getClient()
      if (!client) throw new Error('Not connected')
      setLoading(true)
      try {
        const workerBytes = algosdk.decodeAddress(workerAddress).publicKey
        await client.send.updateRating({
          args: { worker: workerAddress, newRating },
          boxReferences: [
            {
              appId: BigInt(REGISTRY_APP_ID),
              name: new Uint8Array([...new TextEncoder().encode('wrk_'), ...workerBytes]),
            },
          ],
        })
      } finally {
        setLoading(false)
      }
    },
    [getClient],
  )

  const getWorkerInfo = useCallback(
    async (worker: string) => {
      const client = getClient()
      if (!client) return null
      try {
        const workerBytes = algosdk.decodeAddress(worker).publicKey
        const boxRef = {
          appId: BigInt(REGISTRY_APP_ID),
          name: new Uint8Array([...new TextEncoder().encode('wrk_'), ...workerBytes]),
        }
        const result = await client
          .newGroup()
          .getWorkerInfo({ args: { worker }, boxReferences: [boxRef] })
          .simulate({ allowUnnamedResources: true, skipSignatures: true })
        return result.returns[0]
      } catch (e) {
        console.error('getWorkerInfo error:', e)
        return null
      }
    },
    [getClient],
  )

  const incrementEarnings = useCallback(
    async (workerAddress: string, amount: number) => {
      const client = getClient()
      if (!client) throw new Error('Not connected')
      try {
        const workerBytes = algosdk.decodeAddress(workerAddress).publicKey
        await client.send.incrementEarnings({
          args: { worker: workerAddress, amount },
          boxReferences: [
            {
              appId: BigInt(REGISTRY_APP_ID),
              name: new Uint8Array([...new TextEncoder().encode('wrk_'), ...workerBytes]),
            },
          ],
        })
      } catch (e) {
        console.error('incrementEarnings error:', e)
      }
    },
    [getClient],
  )

  return { addWorker, updateRating, incrementEarnings, getWorkerInfo, loading }
}
