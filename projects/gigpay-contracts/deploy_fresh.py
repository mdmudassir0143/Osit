"""Deploy fresh instances of all 3 contracts to testnet."""
import logging
from dotenv import load_dotenv
import algokit_utils

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-10s: %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

algorand = algokit_utils.AlgorandClient.from_environment()
deployer = algorand.account.from_environment("DEPLOYER")
logger.info(f"Deployer: {deployer.address}")

# 1. Deploy WorkerRegistry
from smart_contracts.artifacts.worker_registry.worker_registry_client import (
    WorkerRegistryFactory,
)
wr_factory = algorand.client.get_typed_app_factory(WorkerRegistryFactory, default_sender=deployer.address)
wr_client, wr_result = wr_factory.send.create.create()
logger.info(f"WorkerRegistry app_id={wr_client.app_id} address={wr_client.app_address}")

# Fund it
algorand.send.payment(algokit_utils.PaymentParams(
    amount=algokit_utils.AlgoAmount(algo=1),
    sender=deployer.address,
    receiver=wr_client.app_address,
))

# 2. Deploy DeliveryManager
from smart_contracts.artifacts.task_verification.delivery_manager_client import (
    DeliveryManagerFactory,
)
dm_factory = algorand.client.get_typed_app_factory(DeliveryManagerFactory, default_sender=deployer.address)
dm_client, dm_result = dm_factory.send.create.create()
logger.info(f"DeliveryManager app_id={dm_client.app_id} address={dm_client.app_address}")

algorand.send.payment(algokit_utils.PaymentParams(
    amount=algokit_utils.AlgoAmount(algo=1),
    sender=deployer.address,
    receiver=dm_client.app_address,
))

# 3. Deploy EscrowPool
from smart_contracts.artifacts.escrow_pool.escrow_pool_client import (
    EscrowPoolFactory,
)
ep_factory = algorand.client.get_typed_app_factory(EscrowPoolFactory, default_sender=deployer.address)
ep_client, ep_result = ep_factory.send.create.bare()
logger.info(f"EscrowPool app_id={ep_client.app_id} address={ep_client.app_address}")

algorand.send.payment(algokit_utils.PaymentParams(
    amount=algokit_utils.AlgoAmount(algo=1),
    sender=deployer.address,
    receiver=ep_client.app_address,
))

print("\n" + "=" * 60)
print("UPDATE your .env files with these new app IDs:")
print(f"  VITE_REGISTRY_APP_ID={wr_client.app_id}")
print(f"  VITE_TASK_APP_ID={dm_client.app_id}")
print(f"  VITE_ESCROW_APP_ID={ep_client.app_id}")
print(f"  VITE_ADMIN_ADDRESS={deployer.address}")
print("=" * 60)
