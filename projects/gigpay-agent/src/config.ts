export const config = {
  // Contract app IDs (set after deployment)
  escrowPoolAppId: Number(process.env.ESCROW_POOL_APP_ID) || 0,
  workerRegistryAppId: Number(process.env.WORKER_REGISTRY_APP_ID) || 0,
  taskVerificationAppId: Number(process.env.TASK_VERIFICATION_APP_ID) || 0,

  // USDC ASA ID
  usdcAssetId: Number(process.env.USDC_ASSET_ID) || 0,

  // Oracle config
  oracleUrl: process.env.ORACLE_URL || "http://localhost:3001",

  // Agent config
  pollingIntervalMs: Number(process.env.POLLING_INTERVAL_MS) || 10_000,
  batchSize: Number(process.env.BATCH_SIZE) || 16,

  // Algorand network
  algodServer: process.env.ALGOD_SERVER || "http://localhost",
  algodPort: Number(process.env.ALGOD_PORT) || 4001,
  algodToken:
    process.env.ALGOD_TOKEN ||
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

  // Agent mnemonic
  agentMnemonic: process.env.AGENT_MNEMONIC || "",
};
