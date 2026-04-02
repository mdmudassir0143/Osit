import { config } from "./config.js";
import { TaskMonitor } from "./services/task-monitor.js";
import { OracleClient } from "./services/oracle-client.js";
import { PaymentReleaser } from "./services/payment-releaser.js";
import { DisputeHandler } from "./services/dispute-handler.js";

async function main() {
  console.log("GigPay Agent starting...");
  console.log(`Escrow App ID: ${config.escrowPoolAppId}`);
  console.log(`Task Verification App ID: ${config.taskVerificationAppId}`);
  console.log(`Worker Registry App ID: ${config.workerRegistryAppId}`);
  console.log(`Oracle URL: ${config.oracleUrl}`);
  console.log(`Polling interval: ${config.pollingIntervalMs}ms`);

  const taskMonitor = new TaskMonitor();
  const oracleClient = new OracleClient();
  const paymentReleaser = new PaymentReleaser(config.agentMnemonic);
  const disputeHandler = new DisputeHandler();

  // Agent loop
  while (true) {
    try {
      // 1. Poll for pending tasks
      const pendingTasks = await taskMonitor.getPendingTasks();

      if (pendingTasks.length > 0) {
        console.log(`Found ${pendingTasks.length} pending tasks`);

        const verifiedReleases: Array<{
          worker: string;
          amount: number;
          taskId: number;
        }> = [];

        // 2. Verify each task via oracle
        for (const task of pendingTasks) {
          try {
            const result = await oracleClient.verify({
              taskId: task.taskId,
              workerId: task.worker,
              photoHash: task.proofHash,
              latitude: 19.076, // placeholder - would come from proof data
              longitude: 72.8777,
              timestamp: Math.floor(Date.now() / 1000),
            });

            if (result.verified) {
              console.log(`Task ${task.taskId} verified`);
              verifiedReleases.push({
                worker: task.worker,
                amount: task.amount,
                taskId: task.taskId,
              });
            } else {
              console.log(
                `Task ${task.taskId} verification failed:`,
                result.reasons
              );
            }
          } catch (err) {
            console.error(`Error verifying task ${task.taskId}:`, err);
          }
        }

        // 3. Batch release payments for verified tasks
        if (verifiedReleases.length > 0) {
          // Process in batches of 16 (Algorand max inner txns)
          for (let i = 0; i < verifiedReleases.length; i += config.batchSize) {
            const batch = verifiedReleases.slice(i, i + config.batchSize);

            if (batch.length === 1) {
              await paymentReleaser.releasePayment(batch[0]);
            } else {
              await paymentReleaser.batchRelease(batch);
            }
          }
        }
      }

      // 4. Check for disputes
      await disputeHandler.checkDisputedTasks();
    } catch (err) {
      console.error("Agent loop error:", err);
    }

    // 5. Sleep
    await new Promise((resolve) =>
      setTimeout(resolve, config.pollingIntervalMs)
    );
  }
}

main().catch(console.error);
