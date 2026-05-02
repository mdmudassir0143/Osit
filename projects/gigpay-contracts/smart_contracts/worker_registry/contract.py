"""WorkerRegistry — sybil-anchored worker identity.

Maps verified phone hashes to wallet addresses; stores a self-declared handle.
No PII on-chain. No rating, earnings, or work-history fields — those live in
the AttestationLog contract.
"""

import typing

from algopy import (
    ARC4Contract,
    BoxMap,
    Global,
    Txn,
    arc4,
)

MIN_HANDLE_LEN = 4
MAX_HANDLE_LEN = 32

PhoneHash: typing.TypeAlias = arc4.StaticArray[arc4.Byte, typing.Literal[32]]


class WorkerInfo(arc4.Struct):
    handle: arc4.String
    phone_hash: PhoneHash
    registered_at: arc4.UInt64


class WorkerRegistry(ARC4Contract):
    def __init__(self) -> None:
        # Box prefix "wkr" + 32-byte address → WorkerInfo
        self.workers = BoxMap(arc4.Address, WorkerInfo, key_prefix=b"wkr")
        # Box prefix "phn" + 32-byte phone_hash → wallet Address
        self.phone_index = BoxMap(PhoneHash, arc4.Address, key_prefix=b"phn")

    @arc4.abimethod
    def register_worker(
        self,
        phone_hash: PhoneHash,
        handle: arc4.String,
    ) -> None:
        sender = arc4.Address(Txn.sender)
        handle_len = handle.bytes.length
        assert handle_len >= MIN_HANDLE_LEN, "handle too short"
        assert handle_len <= MAX_HANDLE_LEN, "handle too long"
        assert sender not in self.workers, "address already registered"
        assert phone_hash not in self.phone_index, "phone already registered"

        self.workers[sender] = WorkerInfo(
            handle=handle,
            phone_hash=phone_hash.copy(),
            registered_at=arc4.UInt64(Global.latest_timestamp),
        )
        self.phone_index[phone_hash] = sender.copy()

    @arc4.abimethod
    def update_handle(self, handle: arc4.String) -> None:
        sender = arc4.Address(Txn.sender)
        handle_len = handle.bytes.length
        assert handle_len >= MIN_HANDLE_LEN, "handle too short"
        assert handle_len <= MAX_HANDLE_LEN, "handle too long"
        assert sender in self.workers, "not registered"
        existing = self.workers[sender].copy()
        self.workers[sender] = WorkerInfo(
            handle=handle,
            phone_hash=existing.phone_hash.copy(),
            registered_at=existing.registered_at,
        )

    @arc4.abimethod(readonly=True)
    def lookup_by_phone_hash(self, phone_hash: PhoneHash) -> arc4.Address:
        assert phone_hash in self.phone_index, "phone not registered"
        return self.phone_index[phone_hash]

    @arc4.abimethod(readonly=True)
    def get_worker_info(self, addr: arc4.Address) -> WorkerInfo:
        assert addr in self.workers, "not registered"
        return self.workers[addr]

    @arc4.abimethod(readonly=True)
    def is_registered(self, addr: arc4.Address) -> arc4.Bool:
        return arc4.Bool(addr in self.workers)
