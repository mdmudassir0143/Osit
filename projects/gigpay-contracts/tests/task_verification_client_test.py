import algosdk
import algokit_utils
import pytest
from algokit_utils import AlgoAmount, AlgorandClient, CommonAppCallParams, SigningAccount

from smart_contracts.artifacts.task_verification.task_verification_client import (
    DeliveryManagerClient,
    DeliveryManagerFactory,
)


@pytest.fixture()
def delivery(
    algorand_client: AlgorandClient, deployer: SigningAccount
) -> DeliveryManagerClient:
    factory = algorand_client.client.get_typed_app_factory(
        DeliveryManagerFactory, default_sender=deployer.address
    )
    client, _ = factory.send.create.create()
    algorand_client.send.payment(
        algokit_utils.PaymentParams(
            amount=AlgoAmount.from_algo(1),
            sender=deployer.address,
            receiver=client.app_address,
        )
    )
    return client


def _dlv_box(delivery_id: int) -> algokit_utils.BoxReference:
    return algokit_utils.BoxReference(
        app_id=0,
        name=b"dlv_" + delivery_id.to_bytes(8, "big"),
    )


def test_create_and_confirm_delivery(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    delivery: DeliveryManagerClient,
) -> None:
    """Test creating a delivery and confirming it with rating-based payout."""
    delivery_id = 1
    base_amount = 1_000_000  # 1 USDC
    box_ref = _dlv_box(delivery_id)

    # Create delivery
    delivery.send.create_delivery(
        args={
            "delivery_id": delivery_id,
            "worker": worker_account.address,
            "base_amount": base_amount,
            "customer_name": b"Ankit Sharma",
            "pickup": b"Koramangala",
            "dropoff": b"Indiranagar",
        },
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    # Check status is assigned (0)
    result = delivery.send.get_delivery_status(
        args={"delivery_id": delivery_id},
        params=CommonAppCallParams(box_references=[box_ref]),
    )
    assert result.abi_return == 0

    # Confirm with 5-star rating (50) → 150% multiplier → 1.5 USDC
    delivery.send.confirm_delivery(
        args={"delivery_id": delivery_id, "worker_rating": 50},
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    # Check status is delivered (2)
    result = delivery.send.get_delivery_status(
        args={"delivery_id": delivery_id},
        params=CommonAppCallParams(box_references=[box_ref]),
    )
    assert result.abi_return == 2

    # Check final amount reflects rating multiplier
    amount_result = delivery.send.get_delivery_amount(
        args={"delivery_id": delivery_id},
        params=CommonAppCallParams(box_references=[box_ref]),
    )
    # 1_000_000 * 150 / 100 = 1_500_000
    assert amount_result.abi_return == 1_500_000


def test_pickup_then_deliver(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    delivery: DeliveryManagerClient,
) -> None:
    """Test the full flow: assigned → picked_up → delivered."""
    delivery_id = 2
    box_ref = _dlv_box(delivery_id)

    delivery.send.create_delivery(
        args={
            "delivery_id": delivery_id,
            "worker": worker_account.address,
            "base_amount": 2_000_000,
            "customer_name": b"Meera Patel",
            "pickup": b"HSR Layout",
            "dropoff": b"Whitefield",
        },
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    # Mark picked up
    delivery.send.mark_picked_up(
        args={"delivery_id": delivery_id},
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    result = delivery.send.get_delivery_status(
        args={"delivery_id": delivery_id},
        params=CommonAppCallParams(box_references=[box_ref]),
    )
    assert result.abi_return == 1  # picked_up

    # Confirm with 2-star rating (20) → 80% multiplier
    delivery.send.confirm_delivery(
        args={"delivery_id": delivery_id, "worker_rating": 20},
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    amount_result = delivery.send.get_delivery_amount(
        args={"delivery_id": delivery_id},
        params=CommonAppCallParams(box_references=[box_ref]),
    )
    # 2_000_000 * 84 / 100 = 1_680_000 (formula: 40 + 20*22/10 = 40+44=84)
    assert amount_result.abi_return == 1_680_000


def test_get_delivery_worker(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    delivery: DeliveryManagerClient,
) -> None:
    """Test getting the worker address from a delivery."""
    delivery_id = 3
    box_ref = _dlv_box(delivery_id)

    delivery.send.create_delivery(
        args={
            "delivery_id": delivery_id,
            "worker": worker_account.address,
            "base_amount": 500_000,
            "customer_name": b"Test Customer",
            "pickup": b"Point A",
            "dropoff": b"Point B",
        },
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    result = delivery.send.get_delivery_worker(
        args={"delivery_id": delivery_id},
        params=CommonAppCallParams(box_references=[box_ref]),
    )
    assert result.abi_return == worker_account.address
