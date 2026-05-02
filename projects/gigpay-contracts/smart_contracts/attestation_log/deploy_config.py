import logging

import algokit_utils

logger = logging.getLogger(__name__)


def deploy() -> None:
    from smart_contracts.artifacts.attestation_log.attestation_log_client import (
        AttestationLogFactory,
    )

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer_ = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        AttestationLogFactory, default_sender=deployer_.address
    )

    app_client, _ = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    logger.info(
        f"Deployed {app_client.app_name} ({app_client.app_id}) "
        f"at {app_client.app_address}"
    )
