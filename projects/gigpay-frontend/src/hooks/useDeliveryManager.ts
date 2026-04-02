import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { DeliveryManagerClient } from '../contracts/TaskVerification'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { useCallback, useState } from 'react'

const DELIVERY_APP_ID = Number(import.meta.env.VITE_TASK_APP_ID) || 0

export function useDeliveryManager() {
  const { activeAddress, transactionSigner } = useWallet()
  const [loading, setLoading] = useState(false)

  const getClient = useCallback((): DeliveryManagerClient | null => {
    if (!activeAddress || !DELIVERY_APP_ID) return null
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
    algorand.setDefaultSigner(transactionSigner)

    return new DeliveryManagerClient({
      appId: BigInt(DELIVERY_APP_ID),
      algorand,
      defaultSender: activeAddress,
    })
  }, [activeAddress, transactionSigner])

  const createDelivery = useCallback(
    async (deliveryId: number, workerAddress: string, baseAmount: number, customerName: string, pickup: string, dropoff: string) => {
      const client = getClient()
      if (!client) throw new Error('Not connected')
      setLoading(true)
      try {
        const idBytes = new Uint8Array(8)
        new DataView(idBytes.buffer).setBigUint64(0, BigInt(deliveryId))

        await client.send.createDelivery({
          args: {
            deliveryId,
            worker: workerAddress,
            baseAmount,
            customerName: new TextEncoder().encode(customerName),
            pickup: new TextEncoder().encode(pickup),
            dropoff: new TextEncoder().encode(dropoff),
          },
          boxReferences: [
            { appId: BigInt(DELIVERY_APP_ID), name: new Uint8Array([...new TextEncoder().encode('dlv_'), ...idBytes]) },
          ],
        })
      } finally {
        setLoading(false)
      }
    },
    [getClient],
  )

  const markPickedUp = useCallback(
    async (deliveryId: number) => {
      const client = getClient()
      if (!client) throw new Error('Not connected')
      setLoading(true)
      try {
        const idBytes = new Uint8Array(8)
        new DataView(idBytes.buffer).setBigUint64(0, BigInt(deliveryId))
        await client.send.markPickedUp({
          args: { deliveryId },
          boxReferences: [
            { appId: BigInt(DELIVERY_APP_ID), name: new Uint8Array([...new TextEncoder().encode('dlv_'), ...idBytes]) },
          ],
        })
      } finally {
        setLoading(false)
      }
    },
    [getClient],
  )

  const confirmDelivery = useCallback(
    async (deliveryId: number, workerRating: number) => {
      const client = getClient()
      if (!client) throw new Error('Not connected')
      setLoading(true)
      try {
        const idBytes = new Uint8Array(8)
        new DataView(idBytes.buffer).setBigUint64(0, BigInt(deliveryId))
        await client.send.confirmDelivery({
          args: { deliveryId, workerRating },
          boxReferences: [
            { appId: BigInt(DELIVERY_APP_ID), name: new Uint8Array([...new TextEncoder().encode('dlv_'), ...idBytes]) },
          ],
        })
      } finally {
        setLoading(false)
      }
    },
    [getClient],
  )

  const markPaid = useCallback(
    async (deliveryId: number) => {
      const client = getClient()
      if (!client) throw new Error('Not connected')
      setLoading(true)
      try {
        const idBytes = new Uint8Array(8)
        new DataView(idBytes.buffer).setBigUint64(0, BigInt(deliveryId))
        await client.send.markPaid({
          args: { deliveryId },
          boxReferences: [
            { appId: BigInt(DELIVERY_APP_ID), name: new Uint8Array([...new TextEncoder().encode('dlv_'), ...idBytes]) },
          ],
        })
      } finally {
        setLoading(false)
      }
    },
    [getClient],
  )

  return { createDelivery, markPickedUp, confirmDelivery, markPaid, loading }
}
