import pytest
import algokit_utils
from algokit_utils import (
    AlgoAmount,
    AlgorandClient,
    SigningAccount,
)
from algokit_utils.config import config

from smart_contracts.artifacts.escrow_pool.escrow_pool_client import (
    EscrowPoolClient,
    EscrowPoolFactory,
)
from smart_contracts.artifacts.worker_registry.worker_registry_client import (
    WorkerRegistryClient,
    WorkerRegistryFactory,
)
from smart_contracts.artifacts.task_verification.task_verification_client import (
    DeliveryManagerClient,
    DeliveryManagerFactory,
)

config.configure(debug=True)


@pytest.fixture(scope="session")
def algorand_client() -> AlgorandClient:
    return AlgorandClient.from_environment()


@pytest.fixture()
def deployer(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.from_environment("DEPLOYER")
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address,
        min_spending_balance=AlgoAmount.from_algo(10),
    )
    return account


@pytest.fixture()
def worker_account(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address,
        min_spending_balance=AlgoAmount.from_algo(5),
    )
    return account


@pytest.fixture()
def mock_usdc_id(algorand_client: AlgorandClient, deployer: SigningAccount) -> int:
    """Create a mock USDC ASA on localnet with 6 decimals."""
    result = algorand_client.send.asset_create(
        algokit_utils.AssetCreateParams(
            sender=deployer.address,
            total=10_000_000_000_000,  # 10M USDC
            decimals=6,
            unit_name="USDC",
            asset_name="Mock USDC",
            default_frozen=False,
        )
    )
    return result.asset_id


@pytest.fixture()
def escrow_client(
    algorand_client: AlgorandClient, deployer: SigningAccount
) -> EscrowPoolClient:
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
    return client


@pytest.fixture()
def registry_client(
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


@pytest.fixture()
def delivery_client(
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
