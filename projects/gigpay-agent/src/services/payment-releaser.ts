import algosdk from "algosdk";
import { config } from "../config.js";

interface PaymentRelease {
  worker: string;
  amount: number;
  taskId: number;
}

/**
 * Releases USDC payments from the EscrowPool contract to workers.
 */
export class PaymentReleaser {
  private algodClient: algosdk.Algodv2;
  private agentAccount: algosdk.Account;
  private escrowAppId: number;

  constructor(agentMnemonic: string) {
    this.algodClient = new algosdk.Algodv2(
      config.algodToken,
      config.algodServer,
      config.algodPort
    );
    this.agentAccount = algosdk.mnemonicToSecretKey(agentMnemonic);
    this.escrowAppId = config.escrowPoolAppId;
  }

  /**
   * Release a single payment to a worker.
   */
  async releasePayment(release: PaymentRelease): Promise<string> {
    const suggestedParams = await this.algodClient.getTransactionParams().do();

    // Cover inner transaction fee via fee pooling
    suggestedParams.fee = BigInt(2000);
    suggestedParams.flatFee = true;

    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: this.agentAccount.addr,
      appIndex: this.escrowAppId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new TextEncoder().encode("release_payment(address,uint64,uint64)void"),
        algosdk.decodeAddress(release.worker).publicKey,
        algosdk.encodeUint64(release.amount),
        algosdk.encodeUint64(release.taskId),
      ],
      boxes: [
        {
          appIndex: this.escrowAppId,
          name: new Uint8Array([
            ...new TextEncoder().encode("pay_"),
            ...algosdk.decodeAddress(release.worker).publicKey,
            ...algosdk.encodeUint64(release.taskId),
          ]),
        },
      ],
      suggestedParams,
    });

    const signedTxn = appCallTxn.signTxn(this.agentAccount.sk);
    const { txid } = await this.algodClient.sendRawTransaction(signedTxn).do();
    await algosdk.waitForConfirmation(this.algodClient, txid, 4);

    console.log(`Payment released: ${release.amount} to ${release.worker} (task ${release.taskId}) - txid: ${txid}`);
    return txid;
  }

  /**
   * Batch release payments to multiple workers (up to 16).
   */
  async batchRelease(releases: PaymentRelease[]): Promise<string> {
    if (releases.length === 0) return "";
    if (releases.length > 16) {
      throw new Error("Batch size cannot exceed 16");
    }

    const suggestedParams = await this.algodClient.getTransactionParams().do();
    // Cover all inner transaction fees
    suggestedParams.fee = BigInt((releases.length + 1) * 1000);
    suggestedParams.flatFee = true;

    const workers = releases.map((r) => r.worker);
    const amounts = releases.map((r) => r.amount);
    const taskIds = releases.map((r) => r.taskId);

    const boxes = releases.map((r) => ({
      appIndex: this.escrowAppId,
      name: new Uint8Array([
        ...new TextEncoder().encode("pay_"),
        ...algosdk.decodeAddress(r.worker).publicKey,
        ...algosdk.encodeUint64(r.taskId),
      ]),
    }));

    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: this.agentAccount.addr,
      appIndex: this.escrowAppId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new TextEncoder().encode(
          "batch_release(address[],uint64[],uint64[])void"
        ),
        algosdk.ABIType.from("address[]").encode(workers),
        algosdk.ABIType.from("uint64[]").encode(amounts),
        algosdk.ABIType.from("uint64[]").encode(taskIds),
      ],
      boxes,
      suggestedParams,
    });

    const signedTxn = appCallTxn.signTxn(this.agentAccount.sk);
    const { txid } = await this.algodClient.sendRawTransaction(signedTxn).do();
    await algosdk.waitForConfirmation(this.algodClient, txid, 4);

    console.log(`Batch payment released: ${releases.length} payments - txid: ${txid}`);
    return txid;
  }
}
