import { TransactionSigner } from 'algosdk'
import { WorkerRegistryClient } from '../contracts/WorkerRegistry'
import { getAlgorandClient, getAppIds } from './algorand'

export interface WorkerProfile {
  registered: boolean
  handle: string
  phoneHash: Uint8Array
  registeredAt: bigint
}

function getClient(defaultSender?: string): WorkerRegistryClient {
  const algorand = getAlgorandClient()
  const { workerRegistry } = getAppIds()
  return new WorkerRegistryClient({ algorand, appId: workerRegistry, defaultSender })
}

export async function getWorkerProfile(address: string): Promise<WorkerProfile> {
  const client = getClient(address)
  // Source of truth: is_registered() — never throws on unregistered.
  let registered = false
  try {
    const flag = await client.send.isRegistered({
      args: { addr: address },
      sender: address,
      populateAppCallResources: true,
    })
    registered = flag.return === true
  } catch (err) {
    console.error('isRegistered failed', err)
    return emptyProfile()
  }

  if (!registered) return emptyProfile()

  try {
    const result = await client.send.getWorkerInfo({
      args: { addr: address },
      sender: address,
      populateAppCallResources: true,
    })
    const info = result.return
    if (!info) {
      console.warn('getWorkerInfo returned undefined despite isRegistered=true')
      return { ...emptyProfile(), registered: true }
    }
    return {
      registered: true,
      handle: info.handle,
      phoneHash: new Uint8Array(info.phoneHash as unknown as number[]),
      registeredAt: info.registeredAt,
    }
  } catch (err) {
    console.error('getWorkerInfo failed for registered address', err)
    return { ...emptyProfile(), registered: true }
  }
}

export async function registerWorker(params: {
  sender: string
  signer: TransactionSigner
  phoneHash: Uint8Array
  handle: string
}): Promise<void> {
  const client = getClient(params.sender)
  await client.send.registerWorker({
    args: { phoneHash: params.phoneHash, handle: params.handle },
    sender: params.sender,
    signer: params.signer,
    populateAppCallResources: true,
  })
}

export async function updateHandle(params: { sender: string; signer: TransactionSigner; handle: string }): Promise<void> {
  const client = getClient(params.sender)
  await client.send.updateHandle({
    args: { handle: params.handle },
    sender: params.sender,
    signer: params.signer,
    populateAppCallResources: true,
  })
}

export async function lookupByPhoneHash(phoneHash: Uint8Array, sender: string): Promise<string | null> {
  const client = getClient(sender)
  try {
    const result = await client.send.lookupByPhoneHash({
      args: { phoneHash },
      sender,
      populateAppCallResources: true,
    })
    return (result.return as string) || null
  } catch {
    return null
  }
}

function emptyProfile(): WorkerProfile {
  return {
    registered: false,
    handle: '',
    phoneHash: new Uint8Array(32),
    registeredAt: 0n,
  }
}
