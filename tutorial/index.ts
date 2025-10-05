import { startFromWorker } from "polkadot-api/smoldot/from-node-worker";
import { getSmProvider } from "polkadot-api/sm-provider";
import { chainSpec } from "polkadot-api/chains/polkadot";
import { createClient } from "polkadot-api";
import { dot } from "@polkadot-api/descriptors";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
const ADDRESS = "16JGzEsi8gcySKjpmxHVrkLTHdFHodRepEz8n244gNZpr9J";
async function main() {
  // 1. start a light client on a new worker
  // This is helps with better performance since
  // all the intensive work is moved from the main thread
  const workerPath = fileURLToPath(
    import.meta.resolve("polkadot-api/smoldot/node-worker")
  );
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
  const accountInfo = await api.query.System.Account.getValue(ADDRESS);
  const freebal = accountInfo.data.free;
  const readableBal = Number(freebal) / Math.pow(10, 10);
  console.log(`The current freebal for this user is ${readableBal}`);
}
main();
