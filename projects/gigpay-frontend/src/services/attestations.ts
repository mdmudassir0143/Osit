import { TransactionSigner } from 'algosdk'
import { AttestationLogClient } from '../contracts/AttestationLog'
import { getAlgorandClient, getAppIds } from './algorand'

export interface AttestationRecord {
  id: Uint8Array
  subject: string
  issuer: string
  issuedAt: bigint
  validUntil: bigint
  category: number
  weight: number
  contentCid: Uint8Array
  contentHash: Uint8Array
  revoked: boolean
}

export const CATEGORY_LABELS: Record<number, string> = {
  1: 'Work Event',
  2: 'Skill',
  3: 'Payment Proof',
  4: 'Vouch',
  5: 'Other',
}

function getClient(defaultSender?: string): AttestationLogClient {
  const algorand = getAlgorandClient()
  const { attestationLog } = getAppIds()
  return new AttestationLogClient({ algorand, appId: attestationLog, defaultSender })
}

export async function issueAttestation(params: {
  sender: string
  signer: TransactionSigner
  subject: string
  category: number
  weight: number
  validUntil: bigint
  contentCid: Uint8Array
  contentHash: Uint8Array
}): Promise<Uint8Array> {
  const client = getClient(params.sender)
  const result = await client.send.issueAttestation({
    args: {
      subject: params.subject,
      category: params.category,
      weight: params.weight,
      validUntil: params.validUntil,
      contentCid: params.contentCid,
      contentHash: params.contentHash,
    },
    sender: params.sender,
    signer: params.signer,
    populateAppCallResources: true,
  })
  return new Uint8Array(result.return as unknown as number[])
}

export async function revokeAttestation(params: { sender: string; signer: TransactionSigner; attId: Uint8Array }): Promise<void> {
  const client = getClient(params.sender)
  await client.send.revokeAttestation({
    args: { attId: params.attId },
    sender: params.sender,
    signer: params.signer,
    populateAppCallResources: true,
  })
}

async function getAttestationById(attId: Uint8Array, sender: string): Promise<AttestationRecord | null> {
  const client = getClient(sender)
  try {
    const result = await client.send.getAttestation({
      args: { attId },
      sender,
      populateAppCallResources: true,
    })
    const a = result.return
    if (!a) return null
    return {
      id: attId,
      subject: a.subject as string,
      issuer: a.issuer as string,
      issuedAt: a.issuedAt,
      validUntil: a.validUntil,
      category: Number(a.category),
      weight: Number(a.weight),
      contentCid: new Uint8Array(a.contentCid as unknown as number[]),
      contentHash: new Uint8Array(a.contentHash as unknown as number[]),
      revoked: a.revoked as boolean,
    }
  } catch {
    return null
  }
}

export async function listBySubject(subject: string, sender: string): Promise<AttestationRecord[]> {
  const client = getClient(sender)
  try {
    const countResult = await client.send.getSubjectCount({
      args: { subject },
      sender,
      populateAppCallResources: true,
    })
    const count = Number(countResult.return ?? 0)
    const results: AttestationRecord[] = []
    for (let i = 0; i < count; i++) {
      const idResult = await client.send.getSubjectAttestationId({
        args: { subject, index: BigInt(i) },
        sender,
        populateAppCallResources: true,
      })
      const attId = new Uint8Array(idResult.return as unknown as number[])
      const att = await getAttestationById(attId, sender)
      if (att) results.push(att)
    }
    return results
  } catch (err) {
    console.error('listBySubject failed', err)
    return []
  }
}

export async function listByIssuer(issuer: string, sender: string): Promise<AttestationRecord[]> {
  const client = getClient(sender)
  try {
    const countResult = await client.send.getIssuerCount({
      args: { issuer },
      sender,
      populateAppCallResources: true,
    })
    const count = Number(countResult.return ?? 0)
    const results: AttestationRecord[] = []
    for (let i = 0; i < count; i++) {
      const idResult = await client.send.getIssuerAttestationId({
        args: { issuer, index: BigInt(i) },
        sender,
        populateAppCallResources: true,
      })
      const attId = new Uint8Array(idResult.return as unknown as number[])
      const att = await getAttestationById(attId, sender)
      if (att) results.push(att)
    }
    return results
  } catch (err) {
    console.error('listByIssuer failed', err)
    return []
  }
}
