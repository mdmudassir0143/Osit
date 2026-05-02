import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

let cached: AlgorandClient | null = null

export function getAlgorandClient(): AlgorandClient {
  if (cached) return cached
  const algod = getAlgodConfigFromViteEnvironment()
  const indexer = getIndexerConfigFromViteEnvironment()
  cached = AlgorandClient.fromConfig({ algodConfig: algod, indexerConfig: indexer })
  return cached
}

export function getAppIds(): {
  workerRegistry: bigint
  attestationLog: bigint
  accessGrants: bigint
} {
  const wr = Number(import.meta.env.VITE_WORKER_REGISTRY_APP_ID || 0)
  const al = Number(import.meta.env.VITE_ATTESTATION_LOG_APP_ID || 0)
  const ag = Number(import.meta.env.VITE_ACCESS_GRANTS_APP_ID || 0)
  return {
    workerRegistry: BigInt(wr),
    attestationLog: BigInt(al),
    accessGrants: BigInt(ag),
  }
}
