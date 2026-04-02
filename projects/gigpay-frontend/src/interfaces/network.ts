import { AlgoClientConfig } from '@algorandfoundation/algokit-utils/types/network-client'

type TokenHeader = Record<string, string>

export interface AlgoViteClientConfig extends AlgoClientConfig {
  server: string
  port: string | number
  token: string | TokenHeader
  network: string
}

export interface AlgoViteKMDConfig extends AlgoClientConfig {
  server: string
  port: string | number
  token: string | TokenHeader
  wallet: string
  password: string
}
