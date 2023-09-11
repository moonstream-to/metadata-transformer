// Configures the Metadata Transformer express server and starts the server process

import cors from "cors";
import express, { Express, Request, Response } from "express";
import { Web3 } from "web3";

import metadataTransformer from "../index";
import { MetadataTransformer } from "../data";

// Loads server configuration from environment variables.
const PORT_RAW = process.env.METADATA_TRANSFORMER_PORT || "6374";
const PORT = Number(PORT_RAW);

const WEB3_PROVIDER_URI = process.env.METADATA_TRANSFORMER_WEB3_PROVIDER_URI;
if (!WEB3_PROVIDER_URI) {
  throw new Error("Please set the METADATA_TRANSFORMER_WEB3_PROVIDER_URI");
}
export const web3 = new Web3(
  new Web3.providers.HttpProvider(WEB3_PROVIDER_URI),
);

async function serverStatus(): Promise<object> {
  const serverTimestamp = Math.floor(Date.now() / 1000);
  const chainIDRaw = await web3.eth.getChainId();
  const chainID = Number(chainIDRaw);
  const block = await web3.eth.getBlock();
  const blockNumber = Number(block.number);
  const blockTimestamp = Number(block.timestamp);
  return {
    PORT,
    chainID,
    blockNumber,
    blockTimestamp,
    serverTimestamp,
  };
}

// Callers inject an express application to this function. It sets up the metadata-transformer endpoints
// and runs the application on the port specified by the METADATA_TRANSFORMER_PORT environment variable, defaulting
// to port 6374.
export function run(app: Express, ...transformers: MetadataTransformer[]) {
  metadataTransformer(app, serverStatus, ...transformers);

  app.listen(PORT, () => {
    console.log(`Metadata Transformer running on ${PORT}`);
  });
}
