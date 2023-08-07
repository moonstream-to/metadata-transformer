// Configures the Metadata Transformer express server and starts the server process

import cors from "cors";
import express, { Request, Response } from "express";

import { chain, MetadataTransformer } from "./data";
import { PORT, web3 } from "./settings";

export default function run(...transformers: MetadataTransformer[]) {
  if (transformers.length === 0) {
    throw new Error("No transformers provided.");
  }

  const raw = transformers[0];
  const cumulativeTransform = chain(...transformers);

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

  app.get(
    "/raw/:contractAddress/:tokenID",
    async (req: Request, res: Response) => {
      const contractAddress = req.params.contractAddress;
      const tokenID = req.params.tokenID;
      const metadata = await raw(contractAddress, tokenID);
      return res.status(200).json(metadata);
    }
  );

  app.get(
    "/transformed/:contractAddress/:tokenID",
    async (req: Request, res: Response) => {
      const contractAddress = req.params.contractAddress;
      const tokenID = req.params.tokenID;
      const metadata = await cumulativeTransform(contractAddress, tokenID);
      return res.status(200).json(metadata);
    }
  );

  app.listen(PORT, () => {
    console.log(`Metadata Transformer running on ${PORT}`);
  });
}
