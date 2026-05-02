"""AttestationLog — canonical, signed work-history entries.

Issuers attest to facts about subjects (workers). Each attestation is a
record of fixed core fields plus a content pointer to an off-chain
encrypted blob. Workers and consumers query attestations indexed by
subject and issuer.
"""

import typing

from algopy import (
    ARC4Contract,
    Box,
    BoxMap,
    Global,
    Txn,
    UInt64,
    arc4,
    op,
    subroutine,
)

MAX_WEIGHT = 10000

Bytes32: typing.TypeAlias = arc4.StaticArray[arc4.Byte, typing.Literal[32]]


class Attestation(arc4.Struct):
    subject: arc4.Address
    issuer: arc4.Address
    issued_at: arc4.UInt64
    valid_until: arc4.UInt64
    category: arc4.UInt8
    weight: arc4.UInt16
    content_cid: Bytes32
    content_hash: Bytes32
    revoked: arc4.Bool


class AttestationLog(ARC4Contract):
    def __init__(self) -> None:
        # att_{id} → Attestation
        self.attestations = BoxMap(Bytes32, Attestation, key_prefix=b"att")
        # cnt_s_{address} → number of attestations against this subject
        self.subject_count = BoxMap(
            arc4.Address, arc4.UInt64, key_prefix=b"cnt_s"
        )
        # cnt_i_{address} → number of attestations issued by this issuer
        self.issuer_count = BoxMap(
            arc4.Address, arc4.UInt64, key_prefix=b"cnt_i"
        )

    @arc4.abimethod
    def issue_attestation(
        self,
        subject: arc4.Address,
        category: arc4.UInt8,
        weight: arc4.UInt16,
        valid_until: arc4.UInt64,
        content_cid: Bytes32,
        content_hash: Bytes32,
    ) -> Bytes32:
        cat = category.native
        assert cat >= 1, "invalid category"
        assert cat <= 5, "invalid category"
        assert weight.native <= MAX_WEIGHT, "weight out of range"

        issuer = arc4.Address(Txn.sender)

        # Read counts BEFORE assigning indices. Critical: att_id derivation must
        # be deterministic across the simulate->execute path so populateAppCallResources
        # picks the right box reference. Using Global.latest_timestamp here would
        # be non-deterministic across rounds.
        i_count_native = self.issuer_count.get(
            key=issuer, default=arc4.UInt64(0)
        ).native
        s_count_native = self.subject_count.get(
            key=subject, default=arc4.UInt64(0)
        ).native

        # id = sha256(issuer || subject || content_cid || issuer_count)
        # (issuer_count makes repeat issuances of the same content distinct;
        # otherwise an issuer could not issue the same claim about the same
        # subject twice.)
        id_preimage = (
            issuer.bytes
            + subject.bytes
            + content_cid.bytes
            + op.itob(i_count_native)
        )
        att_id = Bytes32.from_bytes(op.sha256(id_preimage))

        self.attestations[att_id] = Attestation(
            subject=subject.copy(),
            issuer=issuer.copy(),
            issued_at=arc4.UInt64(Global.latest_timestamp),
            valid_until=valid_until,
            category=category,
            weight=weight,
            content_cid=content_cid.copy(),
            content_hash=content_hash.copy(),
            revoked=arc4.Bool(False),  # noqa: FBT003
        )

        # Subject index: append at slot s_count
        self._set_subject_index(subject, s_count_native, att_id)
        self.subject_count[subject] = arc4.UInt64(s_count_native + 1)

        # Issuer index: append at slot i_count
        self._set_issuer_index(issuer, i_count_native, att_id)
        self.issuer_count[issuer] = arc4.UInt64(i_count_native + 1)

        return att_id

    @arc4.abimethod
    def revoke_attestation(self, att_id: Bytes32) -> None:
        assert att_id in self.attestations, "attestation not found"
        existing = self.attestations[att_id].copy()
        sender = Txn.sender
        assert (
            sender == existing.issuer.native
            or sender == existing.subject.native
        ), "not authorized"
        self.attestations[att_id] = Attestation(
            subject=existing.subject.copy(),
            issuer=existing.issuer.copy(),
            issued_at=existing.issued_at,
            valid_until=existing.valid_until,
            category=existing.category,
            weight=existing.weight,
            content_cid=existing.content_cid.copy(),
            content_hash=existing.content_hash.copy(),
            revoked=arc4.Bool(True),  # noqa: FBT003
        )

    @arc4.abimethod(readonly=True)
    def get_attestation(self, att_id: Bytes32) -> Attestation:
        assert att_id in self.attestations, "attestation not found"
        return self.attestations[att_id]

    @arc4.abimethod(readonly=True)
    def get_subject_count(self, subject: arc4.Address) -> arc4.UInt64:
        return self.subject_count.get(key=subject, default=arc4.UInt64(0))

    @arc4.abimethod(readonly=True)
    def get_issuer_count(self, issuer: arc4.Address) -> arc4.UInt64:
        return self.issuer_count.get(key=issuer, default=arc4.UInt64(0))

    @arc4.abimethod(readonly=True)
    def get_subject_attestation_id(
        self, subject: arc4.Address, index: arc4.UInt64
    ) -> Bytes32:
        key = b"s_idx" + subject.bytes + op.itob(index.native)
        box = Box(Bytes32, key=key)
        assert box, "index out of range"
        return box.value

    @arc4.abimethod(readonly=True)
    def get_issuer_attestation_id(
        self, issuer: arc4.Address, index: arc4.UInt64
    ) -> Bytes32:
        key = b"i_idx" + issuer.bytes + op.itob(index.native)
        box = Box(Bytes32, key=key)
        assert box, "index out of range"
        return box.value

    @subroutine
    def _set_subject_index(
        self,
        subject: arc4.Address,
        index: UInt64,
        att_id: Bytes32,
    ) -> None:
        key = b"s_idx" + subject.bytes + op.itob(index)
        box = Box(Bytes32, key=key)
        box.value = att_id.copy()

    @subroutine
    def _set_issuer_index(
        self,
        issuer: arc4.Address,
        index: UInt64,
        att_id: Bytes32,
    ) -> None:
        key = b"i_idx" + issuer.bytes + op.itob(index)
        box = Box(Bytes32, key=key)
        box.value = att_id.copy()
