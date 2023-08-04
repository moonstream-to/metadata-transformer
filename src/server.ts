// Configures the Metadata Transformer express server and starts the server process

import cors from "cors";
import express, { Request, Response } from "express";

import { PORT, web3 } from "./settings";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", async (_: Request, res: Response) => {
  const serverTimestamp = Math.floor(Date.now() / 1000);
  const chainIDRaw = await web3.eth.getChainId();
  const chainID = Number(chainIDRaw);
  const block = await web3.eth.getBlock();
  const blockNumber = Number(block.number);
  const blockTimestamp = Number(block.timestamp);
  const responseBody = {
    PORT,
    chainID,
    blockNumber,
    blockTimestamp,
    serverTimestamp,
  };
  return res.status(200).json(responseBody);
});

app.listen(PORT, () => {
  console.log(`Metadata Transformer running on ${PORT}`);
});

export default app;
