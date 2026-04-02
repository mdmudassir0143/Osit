import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { DeliveryManagerClient } from '../contracts/TaskVerification'
import { EscrowPoolClient } from '../contracts/EscrowPool'
import { WorkerRegistryClient } from '../contracts/WorkerRegistry'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { useCallback, useState } from 'react'
import algosdk from 'algosdk'

const DELIVERY_APP_ID = Number(import.meta.env.VITE_TASK_APP_ID) || 0
const ESCROW_APP_ID = Number(import.meta.env.VITE_ESCROW_APP_ID) || 0
const REGISTRY_APP_ID = Number(import.meta.env.VITE_REGISTRY_APP_ID) || 0

export function useConfirmAndPay() {
  const { activeAddress, transactionSigner } = useWallet()
  const [loading, setLoading] = useState(false)

  const confirmAndPay = useCallback(
    async (deliveryId: number, workerAddress: string, rating: number, finalAmount: number) => {
      if (!activeAddress) throw new Error('Not connected')
      setLoading(true)
      try {
        // Single AlgorandClient shared across all 3 clients
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        algorand.setDefaultSigner(transactionSigner)

        const deliveryClient = new DeliveryManagerClient({
          appId: BigInt(DELIVERY_APP_ID),
          algorand,
          defaultSender: activeAddress,
        })
        const escrowClient = new EscrowPoolClient({
          appId: BigInt(ESCROW_APP_ID),
          algorand,
          defaultSender: activeAddress,
        })
        const registryClient = new WorkerRegistryClient({
          appId: BigInt(REGISTRY_APP_ID),
          algorand,
          defaultSender: activeAddress,
        })

        // Build box references
        const idBytes = new Uint8Array(8)
        new DataView(idBytes.buffer).setBigUint64(0, BigInt(deliveryId))
        const dlvBoxName = new Uint8Array([...new TextEncoder().encode('dlv_'), ...idBytes])

        const workerBytes = algosdk.decodeAddress(workerAddress).publicKey
        const payBoxName = new Uint8Array([...new TextEncoder().encode('pay_'), ...workerBytes, ...idBytes])
        const wrkBoxName = new Uint8Array([...new TextEncoder().encode('wrk_'), ...workerBytes])

        // Get params for all 4 calls (deferred — not sent yet)
        const confirmParams = await deliveryClient.params.confirmDelivery({
          args: { deliveryId, workerRating: rating },
          boxReferences: [{ appId: BigInt(DELIVERY_APP_ID), name: dlvBoxName }],
        })

        const releaseParams = await escrowClient.params.releasePayment({
          args: { worker: workerAddress, amount: finalAmount, deliveryId },
          extraFee: AlgoAmount.MicroAlgo(1000),
          boxReferences: [{ appId: BigInt(ESCROW_APP_ID), name: payBoxName }],
        })

        const markPaidParams = await deliveryClient.params.markPaid({
          args: { deliveryId },
          boxReferences: [{ appId: BigInt(DELIVERY_APP_ID), name: dlvBoxName }],
        })

        const incrementParams = await registryClient.params.incrementEarnings({
          args: { worker: workerAddress, amount: finalAmount },
          boxReferences: [{ appId: BigInt(REGISTRY_APP_ID), name: wrkBoxName }],
        })

        // Compose into single atomic group and send (one signature prompt)
        await algorand
          .newGroup()
          .addAppCallMethodCall(confirmParams)
          .addAppCallMethodCall(releaseParams)
          .addAppCallMethodCall(markPaidParams)
          .addAppCallMethodCall(incrementParams)
          .send()

      } finally {
        setLoading(false)
      }
    },
    [activeAddress, transactionSigner],
  )

  return { confirmAndPay, loading }
}
