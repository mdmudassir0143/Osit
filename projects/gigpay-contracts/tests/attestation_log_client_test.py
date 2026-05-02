"""Tests for the AttestationLog contract."""

import secrets

import algokit_utils
import pytest
from algokit_utils import (
    AlgoAmount,
    AlgorandClient,
    CommonAppCallParams,
    LogicError,
    SigningAccount,
)

from smart_contracts.artifacts.attestation_log.attestation_log_client import (
    AttestationLogClient,
    GetAttestationArgs,
    GetIssuerCountArgs,
    GetSubjectCountArgs,
    IssueAttestationArgs,
    RevokeAttestationArgs,
)


def _b32() -> bytes:
    return secrets.token_bytes(32)


def _send_mbr(
    algorand: AlgorandClient,
    deployer: SigningAccount,
    receiver: str,
    micro: int = 1_000_000,
) -> None:
    algorand.send.payment(
        algokit_utils.PaymentParams(
            sender=deployer.address,
            receiver=receiver,
            amount=AlgoAmount.from_micro_algo(micro),
            note=secrets.token_bytes(8),
        )
    )


def _issue_args(subject: str, **overrides) -> IssueAttestationArgs:
    defaults = {
        "subject": subject,
        "category": 1,
        "weight": 100,
        "valid_until": 0,
        "content_cid": _b32(),
        "content_hash": _b32(),
    }
    defaults.update(overrides)
    return IssueAttestationArgs(**defaults)


def test_issue_attestation_writes_box(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    issuer_account: SigningAccount,
    attestation_log_client: AttestationLogClient,
) -> None:
    _send_mbr(algorand_client, deployer, attestation_log_client.app_address)

    cid = _b32()
    chash = _b32()
    result = attestation_log_client.send.issue_attestation(
        args=_issue_args(
            worker_account.address,
            content_cid=cid,
            content_hash=chash,
            category=2,
            weight=500,
        ),
        params=CommonAppCallParams(sender=issuer_account.address),
        send_params={"populate_app_call_resources": True},
    )
    att_id = bytes(result.abi_return)
    assert len(att_id) == 32

    fetched = attestation_log_client.send.get_attestation(
        args=GetAttestationArgs(att_id=att_id),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    assert fetched.subject == worker_account.address
    assert fetched.issuer == issuer_account.address
    assert fetched.category == 2
    assert fetched.weight == 500
    assert bytes(fetched.content_cid) == cid
    assert bytes(fetched.content_hash) == chash
    assert fetched.revoked is False


def test_issue_increments_subject_and_issuer_counts(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    issuer_account: SigningAccount,
    attestation_log_client: AttestationLogClient,
) -> None:
    _send_mbr(algorand_client, deployer, attestation_log_client.app_address, 2_000_000)

    pre_subject = attestation_log_client.send.get_subject_count(
        args=GetSubjectCountArgs(subject=worker_account.address),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    assert pre_subject == 0

    attestation_log_client.send.issue_attestation(
        args=_issue_args(worker_account.address),
        params=CommonAppCallParams(sender=issuer_account.address),
        send_params={"populate_app_call_resources": True},
    )

    post_subject = attestation_log_client.send.get_subject_count(
        args=GetSubjectCountArgs(subject=worker_account.address),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    assert post_subject == 1

    post_issuer = attestation_log_client.send.get_issuer_count(
        args=GetIssuerCountArgs(issuer=issuer_account.address),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    assert post_issuer == 1

    # Issue a second attestation
    attestation_log_client.send.issue_attestation(
        args=_issue_args(worker_account.address, category=3),
        params=CommonAppCallParams(sender=issuer_account.address),
        send_params={"populate_app_call_resources": True},
    )
    post_subject_2 = attestation_log_client.send.get_subject_count(
        args=GetSubjectCountArgs(subject=worker_account.address),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    assert post_subject_2 == 2


def test_issue_rejects_invalid_category(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    issuer_account: SigningAccount,
    attestation_log_client: AttestationLogClient,
) -> None:
    _send_mbr(algorand_client, deployer, attestation_log_client.app_address)

    with pytest.raises(LogicError):
        attestation_log_client.send.issue_attestation(
            args=_issue_args(worker_account.address, category=0),
            params=CommonAppCallParams(sender=issuer_account.address),
            send_params={"populate_app_call_resources": True},
        )

    with pytest.raises(LogicError):
        attestation_log_client.send.issue_attestation(
            args=_issue_args(worker_account.address, category=6),
            params=CommonAppCallParams(sender=issuer_account.address),
            send_params={"populate_app_call_resources": True},
        )


def test_issue_rejects_excessive_weight(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    issuer_account: SigningAccount,
    attestation_log_client: AttestationLogClient,
) -> None:
    _send_mbr(algorand_client, deployer, attestation_log_client.app_address)
    with pytest.raises(LogicError):
        attestation_log_client.send.issue_attestation(
            args=_issue_args(worker_account.address, weight=10_001),
            params=CommonAppCallParams(sender=issuer_account.address),
            send_params={"populate_app_call_resources": True},
        )


def test_revoke_by_issuer_succeeds(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    issuer_account: SigningAccount,
    attestation_log_client: AttestationLogClient,
) -> None:
    _send_mbr(algorand_client, deployer, attestation_log_client.app_address)

    result = attestation_log_client.send.issue_attestation(
        args=_issue_args(worker_account.address),
        params=CommonAppCallParams(sender=issuer_account.address),
        send_params={"populate_app_call_resources": True},
    )
    att_id = bytes(result.abi_return)

    attestation_log_client.send.revoke_attestation(
        args=RevokeAttestationArgs(att_id=att_id),
        params=CommonAppCallParams(sender=issuer_account.address),
        send_params={"populate_app_call_resources": True},
    )

    after = attestation_log_client.send.get_attestation(
        args=GetAttestationArgs(att_id=att_id),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    assert after.revoked is True


def test_revoke_by_subject_succeeds(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    issuer_account: SigningAccount,
    attestation_log_client: AttestationLogClient,
) -> None:
    _send_mbr(algorand_client, deployer, attestation_log_client.app_address)

    result = attestation_log_client.send.issue_attestation(
        args=_issue_args(worker_account.address),
        params=CommonAppCallParams(sender=issuer_account.address),
        send_params={"populate_app_call_resources": True},
    )
    att_id = bytes(result.abi_return)

    attestation_log_client.send.revoke_attestation(
        args=RevokeAttestationArgs(att_id=att_id),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    after = attestation_log_client.send.get_attestation(
        args=GetAttestationArgs(att_id=att_id),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    assert after.revoked is True


def test_revoke_by_third_party_fails(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    issuer_account: SigningAccount,
    consumer_account: SigningAccount,
    attestation_log_client: AttestationLogClient,
) -> None:
    _send_mbr(algorand_client, deployer, attestation_log_client.app_address)

    result = attestation_log_client.send.issue_attestation(
        args=_issue_args(worker_account.address),
        params=CommonAppCallParams(sender=issuer_account.address),
        send_params={"populate_app_call_resources": True},
    )
    att_id = bytes(result.abi_return)

    with pytest.raises(LogicError):
        attestation_log_client.send.revoke_attestation(
            args=RevokeAttestationArgs(att_id=att_id),
            params=CommonAppCallParams(sender=consumer_account.address),
            send_params={"populate_app_call_resources": True},
        )
