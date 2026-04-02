import { config } from "../config.js";

interface VerificationRequest {
  taskId: number;
  workerId: string;
  photoHash: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface VerificationResponse {
  verified: boolean;
  verificationHash: string;
  taskId: number;
  reasons?: string[];
}

/**
 * Client for calling the x402-protected verification oracle.
 */
export class OracleClient {
  private baseUrl: string;
  private paymentTx: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.oracleUrl;
  }

  /**
   * Set the x402 payment transaction (base64 encoded signed txn).
   * Must be set before calling verify().
   */
  setPaymentTx(signedTxBase64: string): void {
    this.paymentTx = signedTxBase64;
  }

  /**
   * Call the oracle to verify a delivery proof.
   * Requires x402 payment to be set via setPaymentTx().
   */
  async verify(request: VerificationRequest): Promise<VerificationResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.paymentTx) {
      headers["X-PAYMENT-TX"] = this.paymentTx;
    }

    const response = await fetch(`${this.baseUrl}/verify-delivery`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (response.status === 402) {
      const payment402 = await response.json();
      throw new Error(
        `Payment required: ${JSON.stringify(payment402.accepts)}`
      );
    }

    if (!response.ok) {
      throw new Error(`Oracle error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
