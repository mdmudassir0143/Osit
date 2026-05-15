"""Seed the demo worker with a curated set of attestations.

Run from projects/gigpay-contracts:
    poetry run python seed_demo.py

Configuration:
    DEMO_WORKER_ADDRESS  — target worker (defaults to VITE_DEMO_WORKER_ADDRESS)
    DEPLOYER_MNEMONIC    — issuer account (must be funded)

The script issues a fixed set of 8 attestations from the deployer to the
worker, mixing categories so the dashboard renders with rich data. For a
multi-issuer demo, you'd extend this to generate and fund several
issuer accounts; V1 keeps it single-issuer for simplicity.
"""

import hashlib
import os
import secrets

import algokit_utils
from algokit_utils import AlgorandClient, CommonAppCallParams, PaymentParams, AlgoAmount
from dotenv import load_dotenv

load_dotenv()


DEMO_WORKER = os.getenv(
    "DEMO_WORKER_ADDRESS",
    "XXTWTWVTLQIZ42SRUZ5KNMZBHMNHBNBNTEDDOM5MBQF7454WYZMSW2IGFU",
)

# Pulled from frontend .env defaults; override via env vars if redeployed.
ATTESTATION_LOG_APP_ID = int(
    os.getenv("ATTESTATION_LOG_APP_ID", "761388950")
)

SEED_ATTESTATIONS = [
    {"category": 1, "weight": 9000, "claim": "Night-shift housekeeping, 8 hours, Hotel Saffron, 2026-03-12"},
    {"category": 1, "weight": 9200, "claim": "Day-shift housekeeping, 9 hours, Hotel Saffron, 2026-03-13"},
    {"category": 2, "weight": 8500, "claim": "Skill verified: industrial laundry handling and safety"},
    {"category": 3, "weight": 9000, "claim": "Salary disbursement — period: 2026-03, gross: ₹14,200, net: ₹13,810, days worked: 26"},
    {"category": 4, "weight": 9400, "claim": "Vouch: reliable, on-time, picks up shifts on short notice. — manager A."},
    {"category": 1, "weight": 8800, "claim": "Banquet event setup + cleanup, 12 hours, Hotel Saffron, 2026-04-04"},
    {"category": 3, "weight": 9000, "claim": "Salary disbursement — period: 2026-04, gross: ₹15,600, net: ₹15,090, days worked: 28"},
    {"category": 2, "weight": 9100, "claim": "Skill verified: customer interaction and front-desk cover"},
]


def main() -> None:
    algo = AlgorandClient.testnet()
    issuer = algo.account.from_environment("DEPLOYER")
    print(f"Issuing as {issuer.address}")
    print(f"Target worker: {DEMO_WORKER}")
    print(f"AttestationLog app: {ATTESTATION_LOG_APP_ID}")

    # Import the generated client dynamically (depends on a successful build).
    from smart_contracts.artifacts.attestation_log.attestation_log_client import (
        AttestationLogClient,
        IssueAttestationArgs,
    )

    client = AttestationLogClient(algorand=algo, app_id=ATTESTATION_LOG_APP_ID)

    for i, att in enumerate(SEED_ATTESTATIONS):
        # Build a deterministic content hash from the claim, mirroring the
        # frontend's vault stub (sha256 of canonical JSON). Here we just hash
        # the claim string — it's a stub anyway.
        cid = hashlib.sha256(att["claim"].encode("utf-8")).digest()
        try:
            result = client.send.issue_attestation(
                args=IssueAttestationArgs(
                    subject=DEMO_WORKER,
                    category=att["category"],
                    weight=att["weight"],
                    valid_until=0,
                    content_cid=cid,
                    content_hash=cid,
                ),
                params=CommonAppCallParams(
                    sender=issuer.address,
                    signer=issuer.signer,
                    note=secrets.token_bytes(8),
                ),
                send_params={"populate_app_call_resources": True},
            )
            print(f"  [{i+1}/{len(SEED_ATTESTATIONS)}] issued cat={att['category']} weight={att['weight']}")
        except Exception as e:
            print(f"  [{i+1}/{len(SEED_ATTESTATIONS)}] FAILED: {e!r}")
            print("  (App may be out of box-MBR funds; top up the app account and rerun.)")
            break


if __name__ == "__main__":
    main()
