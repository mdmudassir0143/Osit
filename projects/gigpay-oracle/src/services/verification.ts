import { createHash } from "crypto";

interface DeliveryProof {
  taskId: number;
  workerId: string;
  photoHash: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface VerificationResult {
  verified: boolean;
  verificationHash: string;
  taskId: number;
  reasons?: string[];
}

// India bounding box (approximate)
const INDIA_BOUNDS = {
  minLat: 6.0,
  maxLat: 37.0,
  minLng: 68.0,
  maxLng: 97.5,
};

// Maximum age of a proof in seconds (1 hour)
const MAX_PROOF_AGE_SECONDS = 3600;

/**
 * Verify a delivery proof for a gig task.
 *
 * Checks:
 * 1. Timestamp freshness (within 1 hour)
 * 2. GPS coordinates within India bounds
 * 3. Photo hash format validity (SHA-256)
 * 4. Worker ID is a valid Algorand address
 */
export function verifyDeliveryProof(proof: DeliveryProof): VerificationResult {
  const reasons: string[] = [];
  const now = Math.floor(Date.now() / 1000);

  // 1. Timestamp freshness
  const proofAge = now - proof.timestamp;
  if (proofAge > MAX_PROOF_AGE_SECONDS) {
    reasons.push(
      `Proof too old: ${proofAge}s (max ${MAX_PROOF_AGE_SECONDS}s)`
    );
  }
  if (proof.timestamp > now + 60) {
    reasons.push("Proof timestamp is in the future");
  }

  // 2. GPS within India bounds
  if (
    proof.latitude < INDIA_BOUNDS.minLat ||
    proof.latitude > INDIA_BOUNDS.maxLat ||
    proof.longitude < INDIA_BOUNDS.minLng ||
    proof.longitude > INDIA_BOUNDS.maxLng
  ) {
    reasons.push("GPS coordinates outside India bounds");
  }

  // 3. Photo hash format (SHA-256 hex string = 64 chars)
  if (!/^[a-f0-9]{64}$/i.test(proof.photoHash)) {
    reasons.push("Invalid photo hash format (expected SHA-256 hex)");
  }

  // 4. Worker ID format (58-char Algorand address)
  if (proof.workerId.length !== 58) {
    reasons.push("Invalid worker address format");
  }

  const verified = reasons.length === 0;

  // Generate verification hash
  const verificationData = JSON.stringify({
    taskId: proof.taskId,
    workerId: proof.workerId,
    verified,
    timestamp: now,
  });
  const verificationHash = createHash("sha256")
    .update(verificationData)
    .digest("hex");

  return {
    verified,
    verificationHash,
    taskId: proof.taskId,
    ...(reasons.length > 0 ? { reasons } : {}),
  };
}
