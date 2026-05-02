"""Tests for the refactored WorkerRegistry contract."""

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

from smart_contracts.artifacts.worker_registry.worker_registry_client import (
    GetWorkerInfoArgs,
    IsRegisteredArgs,
    LookupByPhoneHashArgs,
    RegisterWorkerArgs,
    UpdateHandleArgs,
    WorkerRegistryClient,
)


def _phone_hash() -> bytes:
    return secrets.token_bytes(32)


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


def test_register_worker_writes_both_maps(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    phone_hash = _phone_hash()
    _send_mbr(algorand_client, deployer, registry_client.app_address, 300_000)

    registry_client.send.register_worker(
        args=RegisterWorkerArgs(phone_hash=phone_hash, handle="raj_kumar"),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    info = registry_client.send.get_worker_info(
        args=GetWorkerInfoArgs(addr=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )
    assert info.abi_return.handle == "raj_kumar"
    assert bytes(info.abi_return.phone_hash) == phone_hash

    looked_up = registry_client.send.lookup_by_phone_hash(
        args=LookupByPhoneHashArgs(phone_hash=phone_hash),
        send_params={"populate_app_call_resources": True},
    )
    assert looked_up.abi_return == worker_account.address


def test_register_worker_rejects_duplicate_phone(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    phone_hash = _phone_hash()
    _send_mbr(algorand_client, deployer, registry_client.app_address, 500_000)

    registry_client.send.register_worker(
        args=RegisterWorkerArgs(phone_hash=phone_hash, handle="first_user"),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    other = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=other.address,
        min_spending_balance=AlgoAmount.from_algo(2),
    )
    with pytest.raises(LogicError):
        registry_client.send.register_worker(
            args=RegisterWorkerArgs(
                phone_hash=phone_hash, handle="second_user"
            ),
            params=CommonAppCallParams(sender=other.address),
            send_params={"populate_app_call_resources": True},
        )


def test_register_worker_rejects_duplicate_address(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    _send_mbr(algorand_client, deployer, registry_client.app_address, 500_000)

    registry_client.send.register_worker(
        args=RegisterWorkerArgs(phone_hash=_phone_hash(), handle="user_one"),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    with pytest.raises(LogicError):
        registry_client.send.register_worker(
            args=RegisterWorkerArgs(
                phone_hash=_phone_hash(), handle="user_two"
            ),
            params=CommonAppCallParams(sender=worker_account.address),
            send_params={"populate_app_call_resources": True},
        )


def test_update_handle_modifies_only_handle(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    phone_hash = _phone_hash()
    _send_mbr(algorand_client, deployer, registry_client.app_address, 300_000)

    registry_client.send.register_worker(
        args=RegisterWorkerArgs(phone_hash=phone_hash, handle="old_handle"),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )
    pre = registry_client.send.get_worker_info(
        args=GetWorkerInfoArgs(addr=worker_account.address),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    pre_registered_at = pre.registered_at

    registry_client.send.update_handle(
        args=UpdateHandleArgs(handle="new_handle"),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    post = registry_client.send.get_worker_info(
        args=GetWorkerInfoArgs(addr=worker_account.address),
        send_params={"populate_app_call_resources": True},
    ).abi_return
    assert post.handle == "new_handle"
    assert bytes(post.phone_hash) == phone_hash
    assert post.registered_at == pre_registered_at


def test_update_handle_unregistered_fails(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    with pytest.raises(LogicError):
        registry_client.send.update_handle(
            args=UpdateHandleArgs(handle="nope_user"),
            params=CommonAppCallParams(sender=worker_account.address),
            send_params={"populate_app_call_resources": True},
        )


def test_handle_length_validation(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    _send_mbr(algorand_client, deployer, registry_client.app_address, 300_000)

    # Handles outside the contract's bounds should fail. The contract
    # enforces 4 <= encoded_length <= 32 (encoded = utf8 + 2-byte length
    # prefix from arc4.String), so we use unambiguously-out-of-range values.
    with pytest.raises(LogicError):
        registry_client.send.register_worker(
            args=RegisterWorkerArgs(phone_hash=_phone_hash(), handle=""),
            params=CommonAppCallParams(sender=worker_account.address),
            send_params={"populate_app_call_resources": True},
        )

    with pytest.raises(LogicError):
        registry_client.send.register_worker(
            args=RegisterWorkerArgs(
                phone_hash=_phone_hash(), handle="x" * 100
            ),
            params=CommonAppCallParams(sender=worker_account.address),
            send_params={"populate_app_call_resources": True},
        )


def test_lookup_unknown_phone_fails(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    with pytest.raises(LogicError):
        registry_client.send.lookup_by_phone_hash(
            args=LookupByPhoneHashArgs(phone_hash=_phone_hash()),
            send_params={"populate_app_call_resources": True},
        )


def test_is_registered_returns_correct_flag(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    pre = registry_client.send.is_registered(
        args=IsRegisteredArgs(addr=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )
    assert pre.abi_return is False

    _send_mbr(algorand_client, deployer, registry_client.app_address, 300_000)
    registry_client.send.register_worker(
        args=RegisterWorkerArgs(phone_hash=_phone_hash(), handle="checker"),
        params=CommonAppCallParams(sender=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )

    post = registry_client.send.is_registered(
        args=IsRegisteredArgs(addr=worker_account.address),
        send_params={"populate_app_call_resources": True},
    )
    assert post.abi_return is True
