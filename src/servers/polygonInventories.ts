import cors from "cors";
import express from "express";
import { createClient } from "redis";

import { run, web3 } from "./run";
import { simpleLogger } from "../middleware/logging";
import {
  redisCachingMiddleware,
  cacheOptionsFromEnv,
} from "../middleware/redisCache";
import { createTokenURITransformer } from "../transformers/tokenURI";
import { createInventoryTransformer } from "../transformers/inventory";

const USE_REDIS = process.env.METADATA_TRANSFORMER_USE_REDIS || "false";
const app = express();
app.use(simpleLogger);
app.use(cors());
app.use(express.json());
if (!!USE_REDIS && USE_REDIS !== "false") {
  const cacheOptions = cacheOptionsFromEnv();
  if (cacheOptions.ttlMilliseconds > 0) {
    console.info(
      `Loading Redis cache middleware -- METADATA_TRANSFORMER_CACHE_TTL_MILLIS: ${cacheOptions.ttlMilliseconds}, METADATA_TRANSFORMER_CACHE_TRACING: ${cacheOptions.tracing}`
    );

    const cache = createClient();
    cache.connect();
    app.use(redisCachingMiddleware(cacheOptions, cache));
  } else {
    console.warn("Cache TTL set to 0 milliseconds, skipping middleware.");
  }
}

// Chain ID should be 137 - this is intended to run against Polygon mainnet.
run(
  app,
  createTokenURITransformer(web3),
  createInventoryTransformer(web3, {
    "0xC740674d2DafF5e59284Fc10a39C862A53BF627D":
      "0x96f47A4FBBFE506e2EFC60a04E37dE82A8564e8C",
  })
);
