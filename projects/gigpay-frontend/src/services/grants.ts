import { TransactionSigner } from 'algosdk'
import { AccessGrantsClient } from '../contracts/AccessGrants'
import { getAlgorandClient, getAppIds } from './algorand'

export const ZERO_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'

export interface GrantRecord {
  worker: string
  consumer: string
  scopeBitmask: number
  grantedAt: bigint
  expiresAt: bigint
  queryLimit: number
  queriesUsed: number
  revoked: boolean
  exists: boolean
}

function getClient(defaultSender?: string): AccessGrantsClient {
  const algorand = getAlgorandClient()
  const { accessGrants } = getAppIds()
  return new AccessGrantsClient({ algorand, appId: accessGrants, defaultSender })
}

export async function grantAccess(params: {
  sender: string
  signer: TransactionSigner
  consumer: string
  scopeBitmask: number
  expiresAt: bigint
  queryLimit: number
}): Promise<void> {
  const client = getClient(params.sender)
  await client.send.grantAccess({
    args: {
      consumer: params.consumer,
      scopeBitmask: params.scopeBitmask,
      expiresAt: params.expiresAt,
      queryLimit: params.queryLimit,
    },
    sender: params.sender,
    signer: params.signer,
    populateAppCallResources: true,
  })
}

export async function revokeAccess(params: { sender: string; signer: TransactionSigner; consumer: string }): Promise<void> {
  const client = getClient(params.sender)
  await client.send.revokeAccess({
    args: { consumer: params.consumer },
    sender: params.sender,
    signer: params.signer,
    populateAppCallResources: true,
  })
}

export async function checkGrant(params: { worker: string; consumer: string; sender: string }): Promise<GrantRecord> {
  const client = getClient(params.sender)
  const result = await client.send.checkGrant({
    args: { worker: params.worker, consumer: params.consumer },
    sender: params.sender,
    populateAppCallResources: true,
  })
  const g = result.return
  if (!g) return emptyGrant()
  const record: GrantRecord = {
    worker: g.worker as string,
    consumer: g.consumer as string,
    scopeBitmask: Number(g.scopeBitmask),
    grantedAt: g.grantedAt,
    expiresAt: g.expiresAt,
    queryLimit: Number(g.queryLimit),
    queriesUsed: Number(g.queriesUsed),
    revoked: g.revoked as boolean,
    exists: (g.worker as string) !== ZERO_ADDRESS,
  }
  return record
}

export function isGrantValid(g: GrantRecord, category: number, nowSec: bigint): boolean {
  if (!g.exists) return false
  if (g.revoked) return false
  if (g.expiresAt > 0n && g.expiresAt < nowSec) return false
  if (g.queryLimit > 0 && g.queriesUsed >= g.queryLimit) return false
  if ((g.scopeBitmask & (1 << (category - 1))) === 0) return false
  return true
}

function emptyGrant(): GrantRecord {
  return {
    worker: ZERO_ADDRESS,
    consumer: ZERO_ADDRESS,
    scopeBitmask: 0,
    grantedAt: 0n,
    expiresAt: 0n,
    queryLimit: 0,
    queriesUsed: 0,
    revoked: false,
    exists: false,
  }
}
