import algosdk from "algosdk";
import { config } from "../config.js";

/**
 * Handles dispute escalation and resolution.
 */
export class DisputeHandler {
  private algodClient: algosdk.Algodv2;
  private taskVerificationAppId: number;

  constructor() {
    this.algodClient = new algosdk.Algodv2(
      config.algodToken,
      config.algodServer,
      config.algodPort
    );
    this.taskVerificationAppId = config.taskVerificationAppId;
  }

  /**
   * Check for disputed tasks and log them for manual review.
   * In production, this would integrate with a dispute resolution system.
   */
  async checkDisputedTasks(): Promise<number[]> {
    const disputedTaskIds: number[] = [];

    try {
      const boxesResponse = await this.algodClient
        .getApplicationBoxes(this.taskVerificationAppId)
        .do();

      for (const box of boxesResponse.boxes) {
        const prefix = new TextEncoder().encode("task_");
        if (!this.bytesStartWith(box.name, prefix)) continue;

        const boxData = await this.algodClient
          .getApplicationBoxByName(this.taskVerificationAppId, box.name)
          .do();

        const statusBytes = boxData.value.slice(64, 72);
        const status = Number(
          BigInt(
            "0x" +
              Array.from(statusBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
          )
        );

        if (status === 2) {
          // disputed
          const taskIdBytes = box.name.slice(prefix.length);
          const taskId = Number(
            BigInt(
              "0x" +
                Array.from(taskIdBytes)
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join("")
            )
          );
          disputedTaskIds.push(taskId);
        }
      }
    } catch (err) {
      console.error("Error checking disputed tasks:", err);
    }

    if (disputedTaskIds.length > 0) {
      console.log(`Found ${disputedTaskIds.length} disputed tasks: ${disputedTaskIds.join(", ")}`);
    }

    return disputedTaskIds;
  }

  private bytesStartWith(data: Uint8Array, prefix: Uint8Array): boolean {
    if (data.length < prefix.length) return false;
    for (let i = 0; i < prefix.length; i++) {
      if (data[i] !== prefix[i]) return false;
    }
    return true;
  }
}
