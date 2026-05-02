"""AccessGrants — per-consumer access grants from workers.

Workers grant scoped, time-bound access to specific consumers (lenders,
insurers, employers). Grants encode which categories the consumer can read,
when access expires, and an optional query budget. Workers can revoke at
any time.

Box keys: prefix "gnt" + sha256(worker || consumer). 35 bytes total.
The hash is necessary because (worker:32B + consumer:32B + prefix:3B) would
exceed the 64-byte box name limit.
"""

import typing

from algopy import (
    ARC4Contract,
    BoxMap,
    Global,
    Txn,
    arc4,
    op,
)

GrantKey: typing.TypeAlias = arc4.StaticArray[arc4.Byte, typing.Literal[32]]


class Grant(arc4.Struct):
    worker: arc4.Address
    consumer: arc4.Address
    scope_bitmask: arc4.UInt32
    granted_at: arc4.UInt64
    expires_at: arc4.UInt64
    query_limit: arc4.UInt32
    queries_used: arc4.UInt32
    revoked: arc4.Bool


class AccessGrants(ARC4Contract):
    def __init__(self) -> None:
        # Composite key derived as sha256(worker || consumer). 32 bytes.
        self.grants = BoxMap(GrantKey, Grant, key_prefix=b"gnt")

    @arc4.abimethod
    def grant_access(
        self,
        consumer: arc4.Address,
        scope_bitmask: arc4.UInt32,
        expires_at: arc4.UInt64,
        query_limit: arc4.UInt32,
    ) -> None:
        worker = arc4.Address(Txn.sender)
        key = GrantKey.from_bytes(op.sha256(worker.bytes + consumer.bytes))
        self.grants[key] = Grant(
            worker=worker.copy(),
            consumer=consumer.copy(),
            scope_bitmask=scope_bitmask,
            granted_at=arc4.UInt64(Global.latest_timestamp),
            expires_at=expires_at,
            query_limit=query_limit,
            queries_used=arc4.UInt32(0),
            revoked=arc4.Bool(False),  # noqa: FBT003
        )

    @arc4.abimethod
    def revoke_access(self, consumer: arc4.Address) -> None:
        worker = arc4.Address(Txn.sender)
        key = GrantKey.from_bytes(op.sha256(worker.bytes + consumer.bytes))
        assert key in self.grants, "no grant to revoke"
        existing = self.grants[key].copy()
        self.grants[key] = Grant(
            worker=existing.worker.copy(),
            consumer=existing.consumer.copy(),
            scope_bitmask=existing.scope_bitmask,
            granted_at=existing.granted_at,
            expires_at=existing.expires_at,
            query_limit=existing.query_limit,
            queries_used=existing.queries_used,
            revoked=arc4.Bool(True),  # noqa: FBT003
        )

    @arc4.abimethod(readonly=True)
    def check_grant(
        self,
        worker: arc4.Address,
        consumer: arc4.Address,
    ) -> Grant:
        key = GrantKey.from_bytes(op.sha256(worker.bytes + consumer.bytes))
        if key in self.grants:
            return self.grants[key]
        zero = arc4.Address(Global.zero_address)
        return Grant(
            worker=zero.copy(),
            consumer=zero.copy(),
            scope_bitmask=arc4.UInt32(0),
            granted_at=arc4.UInt64(0),
            expires_at=arc4.UInt64(0),
            query_limit=arc4.UInt32(0),
            queries_used=arc4.UInt32(0),
            revoked=arc4.Bool(False),  # noqa: FBT003
        )

    @arc4.abimethod(readonly=True)
    def grant_exists(
        self, worker: arc4.Address, consumer: arc4.Address
    ) -> arc4.Bool:
        key = GrantKey.from_bytes(op.sha256(worker.bytes + consumer.bytes))
        return arc4.Bool(key in self.grants)
