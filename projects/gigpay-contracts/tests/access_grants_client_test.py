"""Tests for the AccessGrants contract."""

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

from smart_contracts.artifacts.access_grants.access_grants_client import (
    AccessGrantsClient,
    CheckGrantArgs,
    GrantAccessArgs,
    GrantExistsArgs,
    RevokeAccessArgs,
)


def _send_mbr(
    algorand: AlgorandClient,
    deployer: SigningAccount,
    receiver: str,
    micro: int = 200_000,
) -> None:
    algorand.send.payment(
        algokit_utils.PaymentParams(
            sender=deployer.address,
            receiver=receiver,
            amount=AlgoAmount.from_micro_algo(micro),
            note=secrets.token_bytes(8),
        )
    )


def test_grant_access_writes_box(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    consumer_account: SigningAccount,
    access_grants_client: AccessGrantsClient,
) -> None:
    _send_mbr(algorand_client, deployer, access_grants_client.app_address, 300_000)

    access_grants_client.send.grant_access(
        args=GrantAccessArgs(
            consumer=consumer_account.address,
            scope_bitmask=0b11111,  # all 5 categories
            expires_at=0,
            query_limit=0,
        ),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    grant = access_grants_client.send.check_grant(
        args=CheckGrantArgs(
            worker=worker_account.address,
            consumer=consumer_account.address,
        ),
        send_params={"populate_app_call_resources": True},
    ).abi_return

    assert grant.worker == worker_account.address
    assert grant.consumer == consumer_account.address
    assert grant.scope_bitmask == 0b11111
    assert grant.revoked is False
    assert grant.queries_used == 0


def test_grant_access_can_overwrite(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    consumer_account: SigningAccount,
    access_grants_client: AccessGrantsClient,
) -> None:
    _send_mbr(algorand_client, deployer, access_grants_client.app_address, 300_000)

    access_grants_client.send.grant_access(
        args=GrantAccessArgs(
            consumer=consumer_account.address,
            scope_bitmask=0b00001,
            expires_at=0,
            query_limit=10,
        ),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    access_grants_client.send.grant_access(
        args=GrantAccessArgs(
            consumer=consumer_account.address,
            scope_bitmask=0b11000,
            expires_at=999_999_999,
            query_limit=50,
        ),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    grant = access_grants_client.send.check_grant(
        args=CheckGrantArgs(
            worker=worker_account.address,
            consumer=consumer_account.address,
        ),
        send_params={"populate_app_call_resources": True},
    ).abi_return

    assert grant.scope_bitmask == 0b11000
    assert grant.expires_at == 999_999_999
    assert grant.query_limit == 50


def test_revoke_access_marks_revoked(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    consumer_account: SigningAccount,
    access_grants_client: AccessGrantsClient,
) -> None:
    _send_mbr(algorand_client, deployer, access_grants_client.app_address, 300_000)

    access_grants_client.send.grant_access(
        args=GrantAccessArgs(
            consumer=consumer_account.address,
            scope_bitmask=0b11111,
            expires_at=0,
            query_limit=0,
        ),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    access_grants_client.send.revoke_access(
        args=RevokeAccessArgs(consumer=consumer_account.address),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    grant = access_grants_client.send.check_grant(
        args=CheckGrantArgs(
            worker=worker_account.address,
            consumer=consumer_account.address,
        ),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    assert grant.revoked is True


def test_revoke_access_unknown_grant_fails(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    consumer_account: SigningAccount,
    access_grants_client: AccessGrantsClient,
) -> None:
    with pytest.raises(LogicError):
        access_grants_client.send.revoke_access(
            args=RevokeAccessArgs(consumer=consumer_account.address),
            params=CommonAppCallParams(sender=worker_account.address),
            send_params={"populate_app_call_resources": True},
        )


def test_check_grant_unknown_returns_zero_address_sentinel(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    consumer_account: SigningAccount,
    access_grants_client: AccessGrantsClient,
) -> None:
    grant = access_grants_client.send.check_grant(
        args=CheckGrantArgs(
            worker=worker_account.address,
            consumer=consumer_account.address,
        ),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    # Sentinel: worker is the zero address (52 'A's + 6-char checksum)
    assert (
        grant.worker
        == "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ"
    )


def test_grant_exists_returns_correct_flag(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    consumer_account: SigningAccount,
    access_grants_client: AccessGrantsClient,
) -> None:
    pre = access_grants_client.send.grant_exists(
        args=GrantExistsArgs(
            worker=worker_account.address,
            consumer=consumer_account.address,
        ),
        send_params={"populate_app_call_resources": True},
    )
    assert pre.abi_return is False

    _send_mbr(algorand_client, deployer, access_grants_client.app_address, 300_000)
    access_grants_client.send.grant_access(
        args=GrantAccessArgs(
            consumer=consumer_account.address,
            scope_bitmask=0b00001,
            expires_at=0,
            query_limit=0,
        ),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    post = access_grants_client.send.grant_exists(
        args=GrantExistsArgs(
            worker=worker_account.address,
            consumer=consumer_account.address,
        ),
        send_params={"populate_app_call_resources": True},
    )
    assert post.abi_return is True
