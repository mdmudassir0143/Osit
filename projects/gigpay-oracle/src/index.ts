import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { paymentMiddleware, x402ResourceServer } from "@x402-avm/hono";
import { registerExactAvmScheme } from "@x402-avm/avm/exact/server";
import { HTTPFacilitatorClient } from "@x402-avm/core/server";
import { ALGORAND_TESTNET_CAIP2 } from "@x402-avm/avm";
import { verifyDeliveryProof } from "./services/verification.js";

const app = new Hono();

// CORS for frontend — allow all x402 headers
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type",
      "PAYMENT-SIGNATURE",
      "PAYMENT-REQUIRED",
      "PAYMENT-RESPONSE",
      "Access-Control-Expose-Headers",
      "Access-Control-Allow-Headers",
    ],
    exposeHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"],
  }),
);
app.use("*", logger());

// x402 payment configuration
const PAY_TO =
  process.env.PAY_TO ||
  "DK6LTI4LRPIDHK35BLJIVNURF7EJGWR4TQ265XTTVMYMVC5OJJE22PWWIM";

const facilitatorClient = new HTTPFacilitatorClient({
  url:
    process.env.FACILITATOR_URL || "https://facilitator.goplausible.xyz",
});

const resourceServer = new x402ResourceServer(facilitatorClient);
registerExactAvmScheme(resourceServer);

// Debug hooks on the resource server
resourceServer
  .onBeforeVerify(async (ctx) => {
    console.log("[x402] Before verify — checking payment with facilitator...");
  })
  .onAfterVerify(async (ctx) => {
    console.log("[x402] After verify — payment verified!");
  })
  .onBeforeSettle(async (ctx) => {
    console.log("[x402] Before settle — settling on-chain...");
  })
  .onAfterSettle(async (ctx) => {
    console.log("[x402] After settle — payment settled on-chain!");
  });

const routes = {
  "POST /verify-delivery": {
    accepts: {
      scheme: "exact",
      network: ALGORAND_TESTNET_CAIP2,
      payTo: PAY_TO,
      price: "$0.01",
    },
    description: "Verify a gig delivery proof (x402-protected)",
  },
};

// Apply x402 payment middleware — only /verify-delivery is gated
app.use(paymentMiddleware(routes, resourceServer));

// Health check (free)
app.get("/health", (c) => c.json({ status: "ok", x402: true }));

// Root info (free)
app.get("/", (c) =>
  c.json({
    name: "GigPay Oracle",
    version: "0.2.0",
    x402: {
      protocol: "x402-avm",
      network: ALGORAND_TESTNET_CAIP2,
      verificationCost: "$0.01",
      facilitator: "https://facilitator.goplausible.xyz",
      payTo: PAY_TO,
    },
    endpoints: {
      verify: "POST /verify-delivery ($0.01 — x402 protected)",
      health: "GET /health (free)",
    },
  }),
);

// x402-protected verification endpoint
app.post("/verify-delivery", async (c) => {
  const body = await c.req.json();

  const { taskId, workerId, photoHash, latitude, longitude, timestamp } = body;

  if (
    !taskId ||
    !workerId ||
    !photoHash ||
    latitude === undefined ||
    longitude === undefined ||
    !timestamp
  ) {
    return c.json(
      {
        error: "Missing required fields",
        required: [
          "taskId",
          "workerId",
          "photoHash",
          "latitude",
          "longitude",
          "timestamp",
        ],
      },
      400,
    );
  }

  const result = verifyDeliveryProof({
    taskId: Number(taskId),
    workerId: String(workerId),
    photoHash: String(photoHash),
    latitude: Number(latitude),
    longitude: Number(longitude),
    timestamp: Number(timestamp),
  });

  return c.json(result);
});

const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, () => {
  console.log(`GigPay Oracle running on http://localhost:${port}`);
  console.log(`x402 payment: $0.01 per verification`);
  console.log(`Pay-to: ${PAY_TO}`);
  console.log(`Facilitator: https://facilitator.goplausible.xyz`);
});
