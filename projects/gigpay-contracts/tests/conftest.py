import pytest
import algokit_utils
from algokit_utils import (
    AlgoAmount,
    AlgorandClient,
    SigningAccount,
)
from algokit_utils.config import config

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
def issuer_account(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address,
        min_spending_balance=AlgoAmount.from_algo(5),
    )
    return account


@pytest.fixture()
def consumer_account(algorand_client: AlgorandClient) -> SigningAccount:
    account = algorand_client.account.random()
    algorand_client.account.ensure_funded_from_environment(
        account_to_fund=account.address,
        min_spending_balance=AlgoAmount.from_algo(5),
    )
    return account


@pytest.fixture()
def registry_client(
    algorand_client: AlgorandClient, deployer: SigningAccount
):
    from smart_contracts.artifacts.worker_registry.worker_registry_client import (
        WorkerRegistryFactory,
    )

    factory = algorand_client.client.get_typed_app_factory(
        WorkerRegistryFactory, default_sender=deployer.address
    )
    client, _ = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )
    return client


@pytest.fixture()
def attestation_log_client(
    algorand_client: AlgorandClient, deployer: SigningAccount
):
    from smart_contracts.artifacts.attestation_log.attestation_log_client import (
        AttestationLogFactory,
    )

    factory = algorand_client.client.get_typed_app_factory(
        AttestationLogFactory, default_sender=deployer.address
    )
    client, _ = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )
    return client


@pytest.fixture()
def access_grants_client(
    algorand_client: AlgorandClient, deployer: SigningAccount
):
    from smart_contracts.artifacts.access_grants.access_grants_client import (
        AccessGrantsFactory,
    )

    factory = algorand_client.client.get_typed_app_factory(
        AccessGrantsFactory, default_sender=deployer.address
    )
    client, _ = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )
    return client
