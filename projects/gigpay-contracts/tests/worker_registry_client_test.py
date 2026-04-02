import algosdk
import algokit_utils
from algokit_utils import AlgoAmount, AlgorandClient, CommonAppCallParams, SigningAccount

from smart_contracts.artifacts.worker_registry.worker_registry_client import (
    WorkerRegistryClient,
    WorkerRegistryFactory,
)


@algokit_utils.pytest.fixture()
def registry(
    algorand_client: AlgorandClient, deployer: SigningAccount
) -> WorkerRegistryClient:
    factory = algorand_client.client.get_typed_app_factory(
        WorkerRegistryFactory, default_sender=deployer.address
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


def _worker_box(address: str) -> bytes:
    return b"wrk_" + algosdk.encoding.decode_address(address)


def test_add_worker(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    """Admin adds a worker with personal details."""
    box_name = _worker_box(worker_account.address)

    mbr_pay = algorand_client.create_transaction.payment(
        algokit_utils.PaymentParams(
            sender=deployer.address,
            receiver=registry_client.app_address,
            amount=AlgoAmount.from_micro_algo(100_000),
        )
    )

    registry_client.send.add_worker(
        args={
            "worker": worker_account.address,
            "name": b"Raj Kumar",
            "phone": b"9876543210",
            "upi_id": b"raj@paytm",
            "rating": 45,
            "mbr_pay": mbr_pay,
        },
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[
                algokit_utils.BoxReference(app_id=0, name=box_name),
            ],
        ),
    )

    # Verify worker rating
    result = registry_client.send.get_worker_rating(
        args={"worker": worker_account.address},
        params=CommonAppCallParams(
            box_references=[
                algokit_utils.BoxReference(app_id=0, name=box_name),
            ],
        ),
    )
    assert result.abi_return == 45


def test_update_rating(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    """Admin updates a worker's rating."""
    box_name = _worker_box(worker_account.address)
    box_ref = algokit_utils.BoxReference(app_id=0, name=box_name)

    mbr_pay = algorand_client.create_transaction.payment(
        algokit_utils.PaymentParams(
            sender=deployer.address,
            receiver=registry_client.app_address,
            amount=AlgoAmount.from_micro_algo(100_000),
        )
    )

    registry_client.send.add_worker(
        args={
            "worker": worker_account.address,
            "name": b"Priya Singh",
            "phone": b"9123456789",
            "upi_id": b"priya@gpay",
            "rating": 30,
            "mbr_pay": mbr_pay,
        },
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    registry_client.send.update_rating(
        args={"worker": worker_account.address, "new_rating": 42},
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    result = registry_client.send.get_worker_rating(
        args={"worker": worker_account.address},
        params=CommonAppCallParams(
            box_references=[box_ref],
        ),
    )
    assert result.abi_return == 42


def test_increment_earnings(
    algorand_client: AlgorandClient,
    deployer: SigningAccount,
    worker_account: SigningAccount,
    registry_client: WorkerRegistryClient,
) -> None:
    """Test incrementing worker earnings."""
    box_name = _worker_box(worker_account.address)
    box_ref = algokit_utils.BoxReference(app_id=0, name=box_name)

    mbr_pay = algorand_client.create_transaction.payment(
        algokit_utils.PaymentParams(
            sender=deployer.address,
            receiver=registry_client.app_address,
            amount=AlgoAmount.from_micro_algo(100_000),
        )
    )

    registry_client.send.add_worker(
        args={
            "worker": worker_account.address,
            "name": b"Aman Verma",
            "phone": b"9988776655",
            "upi_id": b"aman@upi",
            "rating": 40,
            "mbr_pay": mbr_pay,
        },
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    registry_client.send.increment_earnings(
        args={"worker": worker_account.address, "amount": 1_000_000},
        params=CommonAppCallParams(
            sender=deployer.address,
            box_references=[box_ref],
        ),
    )

    # get_worker_info returns raw bytes, check it exists
    result = registry_client.send.get_worker_info(
        args={"worker": worker_account.address},
        params=CommonAppCallParams(
            box_references=[box_ref],
        ),
    )
    assert len(result.abi_return) == 120
