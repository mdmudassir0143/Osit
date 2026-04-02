import algosdk from "algosdk";
import { config } from "../config.js";

interface PendingTask {
  taskId: number;
  worker: string;
  proofHash: string;
  amount: number;
}

/**
 * Monitor the TaskVerification contract for pending tasks.
 */
export class TaskMonitor {
  private algodClient: algosdk.Algodv2;
  private appId: number;

  constructor() {
    this.algodClient = new algosdk.Algodv2(
      config.algodToken,
      config.algodServer,
      config.algodPort
    );
    this.appId = config.taskVerificationAppId;
  }

  /**
   * Poll for pending tasks by reading box storage.
   * Returns tasks with status=0 (pending).
   */
  async getPendingTasks(): Promise<PendingTask[]> {
    const pendingTasks: PendingTask[] = [];

    try {
      // Get all boxes for the app
      const boxesResponse = await this.algodClient
        .getApplicationBoxes(this.appId)
        .do();

      for (const box of boxesResponse.boxes) {
        const boxName = box.name;

        // Only process task boxes (prefix "task_")
        const prefix = new TextEncoder().encode("task_");
        if (!this.bytesStartWith(boxName, prefix)) {
          continue;
        }

        // Extract task ID from box name (last 8 bytes)
        const taskIdBytes = boxName.slice(prefix.length);
        const taskId = Number(
          BigInt(
            "0x" +
              Array.from(taskIdBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
          )
        );

        // Read box data
        const boxData = await this.algodClient
          .getApplicationBoxByName(this.appId, boxName)
          .do();

        const data = boxData.value;

        // Parse: worker (32) + proof_hash (32) + status (8) + amount (8) + ...
        const workerBytes = data.slice(0, 32);
        const proofHash = data.slice(32, 64);
        const statusBytes = data.slice(64, 72);
        const amountBytes = data.slice(72, 80);

        const status = Number(
          BigInt(
            "0x" +
              Array.from(statusBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
          )
        );

        // Only return pending tasks (status=0)
        if (status !== 0) continue;

        const amount = Number(
          BigInt(
            "0x" +
              Array.from(amountBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
          )
        );

        const worker = algosdk.encodeAddress(workerBytes);
        const proofHashHex = Array.from(proofHash)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        pendingTasks.push({
          taskId,
          worker,
          proofHash: proofHashHex,
          amount,
        });
      }
    } catch (err) {
      console.error("Error polling for pending tasks:", err);
    }

    return pendingTasks;
  }

  private bytesStartWith(data: Uint8Array, prefix: Uint8Array): boolean {
    if (data.length < prefix.length) return false;
    for (let i = 0; i < prefix.length; i++) {
      if (data[i] !== prefix[i]) return false;
    }
    return true;
  }
}
