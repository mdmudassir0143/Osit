import logging

import algokit_utils

logger = logging.getLogger(__name__)


def deploy() -> None:
    from smart_contracts.artifacts.worker_registry.worker_registry_client import (
        WorkerRegistryFactory,
    )

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer_ = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        WorkerRegistryFactory, default_sender=deployer_.address
    )

    # Create a fresh instance (the contract is not updatable)
    app_client, result = factory.send.create.create()

    algorand.send.payment(
        algokit_utils.PaymentParams(
            amount=algokit_utils.AlgoAmount(algo=1),
            sender=deployer_.address,
            receiver=app_client.app_address,
        )
    )

    logger.info(
        f"Deployed {app_client.app_name} ({app_client.app_id}) "
        f"at {app_client.app_address}"
    )
