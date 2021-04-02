import { calculateTimeout } from "./util";
import {
  LotunClientWorker,
  LotunClientWorkerMessage,
} from "./lotun-client-worker";

let worker: LotunClientWorker | undefined;

process.on("message", async (message: LotunClientWorkerMessage) => {
  if (!process.send) {
    throw new Error("Should not happen");
  }

  if (message.type === "start") {
    const options = message.data;
    new LotunClientWorker(options);
  }
});

process.on("SIGTERM", async () => {
  if (worker) {
    await worker.destroy();
  }
});

if (!process.send) {
  throw new Error("Should not happen");
}

const readyMessage: LotunClientWorkerMessage = {
  type: "ready",
};

process.send(readyMessage);
