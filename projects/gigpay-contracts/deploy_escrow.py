"""Deploy only EscrowPool."""
import logging
from dotenv import load_dotenv
import algokit_utils

logging.basicConfig(level=logging.INFO)
load_dotenv()

algorand = algokit_utils.AlgorandClient.from_environment()
deployer = algorand.account.from_environment("DEPLOYER")

from smart_contracts.artifacts.escrow_pool.escrow_pool_client import EscrowPoolFactory

factory = algorand.client.get_typed_app_factory(EscrowPoolFactory, default_sender=deployer.address)
client, result = factory.send.create.bare()

algorand.send.payment(algokit_utils.PaymentParams(
    amount=algokit_utils.AlgoAmount(algo=1),
    sender=deployer.address,
    receiver=client.app_address,
))

print(f"\nEscrowPool app_id={client.app_id} address={client.app_address}")
print(f"\nAll 3 app IDs:")
print(f"  VITE_REGISTRY_APP_ID=758146545")
print(f"  VITE_TASK_APP_ID=758146562")
print(f"  VITE_ESCROW_APP_ID={client.app_id}")
print(f"  VITE_ADMIN_ADDRESS={deployer.address}")
