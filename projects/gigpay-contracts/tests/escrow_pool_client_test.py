import algosdk
import algokit_utils
import pytest
from algokit_utils import AlgoAmount, AlgorandClient, CommonAppCallParams, SigningAccount

from smart_contracts.artifacts.escrow_pool.escrow_pool_client import (
    EscrowPoolClient,
    EscrowPoolFactory,
)


@pytest.fixture()
def usdc_id(algorand_client: AlgorandClient, deployer: SigningAccount) -> int:
    """Create mock USDC."""
    result = algorand_client.send.asset_create(
        algokit_utils.AssetCreateParams(
            sender=deployer.address,
            total=10_000_000_000_000,
            decimals=6,
            unit_name="USDC",
            asset_name="Mock USDC",
            default_frozen=False,
        )
    )
    return result.asset_id


@pytest.fixture()
def initialized_escrow(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    usdc_id: int,
) -> EscrowPoolClient:
    """Deploy and initialize escrow with USDC opt-in."""
    factory = algorand_client.client.get_typed_app_factory(
        EscrowPoolFactory, default_sender=deployer.address
    )
    client, _ = factory.send.create.bare()

    algorand_client.send.payment(
        algokit_utils.PaymentParams(
            amount=AlgoAmount.from_algo(1),
            sender=deployer.address,
            receiver=client.app_address,
        )
    )

    mbr_pay = algorand_client.create_transaction.payment(
        algokit_utils.PaymentParams(
            amount=AlgoAmount.from_micro_algo(100_000),
            sender=deployer.address,
            receiver=client.app_address,
        )
    )
    client.send.initialize(
        args={"usdc_asset_id": usdc_id, "mbr_pay": mbr_pay},
        params=CommonAppCallParams(sender=deployer.address),
    )
    return client


def test_initialize(initialized_escrow: EscrowPoolClient) -> None:
    """Test that the escrow initializes and opts into USDC."""
    result = initialized_escrow.send.get_balance()
    assert result.abi_return == 0


def test_deposit_funds(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    initialized_escrow: EscrowPoolClient,
    usdc_id: int,
) -> None:
    """Test depositing USDC into the escrow."""
    deposit_amount = 1_000_000  # 1 USDC

    axfer = algorand_client.create_transaction.asset_transfer(
        algokit_utils.AssetTransferParams(
            sender=deployer.address,
            receiver=initialized_escrow.app_address,
            asset_id=usdc_id,
            amount=deposit_amount,
        )
    )

    initialized_escrow.send.deposit_funds(
        args={"payment": axfer, "amount": deposit_amount},
    )

    result = initialized_escrow.send.get_balance()
    assert result.abi_return == deposit_amount


def test_admin_release_payment(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    initialized_escrow: EscrowPoolClient,
    usdc_id: int,
) -> None:
    """Test admin releases payment to worker (no agent needed)."""
    # Deposit USDC
    deposit_amount = 5_000_000
    axfer = algorand_client.create_transaction.asset_transfer(
        algokit_utils.AssetTransferParams(
            sender=deployer.address,
            receiver=initialized_escrow.app_address,
            asset_id=usdc_id,
            amount=deposit_amount,
        )
    )
    initialized_escrow.send.deposit_funds(
        args={"payment": axfer, "amount": deposit_amount},
    )

    # Worker opts into USDC
    algorand_client.send.asset_opt_in(
        algokit_utils.AssetOptInParams(
            sender=worker_account.address,
            asset_id=usdc_id,
        )
    )

    # Admin releases payment directly
    release_amount = 1_500_000  # 1.5 USDC
    pay_box = b"pay_" + algosdk.encoding.decode_address(worker_account.address) + (1).to_bytes(8, "big")

    initialized_escrow.send.release_payment(
        args={
            "worker": worker_account.address,
            "amount": release_amount,
            "delivery_id": 1,
        },
        params=CommonAppCallParams(
            sender=deployer.address,
            static_fee=AlgoAmount.from_micro_algo(2000),
            box_references=[
                algokit_utils.BoxReference(app_id=0, name=pay_box),
            ],
        ),
    )

    result = initialized_escrow.send.get_balance()
    assert result.abi_return == deposit_amount - release_amount


def test_unauthorized_release_fails(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    initialized_escrow: EscrowPoolClient,
) -> None:
    """Test that non-admin cannot release payments."""
    with pytest.raises(Exception):
        initialized_escrow.send.release_payment(
            args={
                "worker": worker_account.address,
                "amount": 1_000_000,
                "delivery_id": 1,
            },
            params=CommonAppCallParams(
                sender=worker_account.address,
            ),
        )
