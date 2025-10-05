import express from "express";
import cors from "cors";
import { startFromWorker } from "polkadot-api/smoldot/from-node-worker";
import { getSmProvider } from "polkadot-api/sm-provider";
import { chainSpec } from "polkadot-api/chains/polkadot";
import { createClient } from "polkadot-api";
import { dot } from "@polkadot-api/descriptors";
import { Worker } from "worker_threads";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const app = express();
app.use(cors());
app.use(express.json());
// const ADDRESS = "16JGzEsi8gcySKjpmxHVrkLTHdFHodRepEz8n244gNZpr9J";

async function getPolkadotBalance(address: string) {
  let workerPath: string;
  // 1. start a light client on a new worker
  // This is helps with better performance since
  // all the intensive work is moved from the main thread
  try {
    // Try to resolve the worker module path
    workerPath = require.resolve("polkadot-api/smoldot/node-worker");
    console.log(`Worker path resolved: ${workerPath}`);
  } catch (error) {
    console.error("Failed to resolve worker path:", error);
    throw new Error("Could not locate polkadot-api worker module");
  }

  const worker = new Worker(workerPath);

  const smoldot = startFromWorker(worker);
  const chain = getSmProvider(smoldot.addChain({ chainSpec }));
  //2. Now we can create a papi client
  console.log("Creating a PAPI client...");
  const client = createClient(chain);
  //3. Get the api that will help us fetch information from the chain
  const api = client.getTypedApi(dot);
  console.log("Waiting for chain to sync...");
  await new Promise((resolve) => {
    const subscription = client.finalizedBlock$.subscribe((block) => {
      console.log(`Chain synced to block #${block.number}`);
      subscription.unsubscribe();
      resolve(block);
    });
  });
  console.log("Querying account info...");
  const accountInfo = await api.query.System.Account.getValue(address);
  const free = Number(accountInfo.data.free) / Math.pow(10, 10);
  const reserved = Number(accountInfo.data.reserved) / Math.pow(10, 10);
  const frozen = Number(accountInfo.data.frozen) / Math.pow(10, 10);
  const total = free + reserved;

  console.log(`The current balance for  user  ${address}  is ${total}`);
  try {
    client.destroy();
    await worker.terminate();
  } catch (e) {
    console.error("Cleanup error:", e);
  }
  return {
    free,
    reserved,
    frozen,
    total,
  };
}
// API endpoint
app.get("/api/balance/:address", async (req: any, res: any) => {
  try {
    const { address } = req.params;
    console.log(`Fetching balance for ${address}...`);
    const balance = await getPolkadotBalance(address);
    res.json({ success: true, data: balance });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch balance",
    });
  }
});

app.listen(3001, () => {
  console.log("🚀 Balance API running on http://localhost:3001");
});
