import { chain, MetadataTransformer } from "../data";
import { run, web3 } from "../server";
import { createTokenURITransformer } from "../transformers/tokenURI";
import { createInventoryTransformer } from "../transformers/inventory";

// Chain ID should be 137 - this is intended to run against Polygon mainnet.
run(
  createTokenURITransformer(web3),
  createInventoryTransformer(web3, {
    "0xC740674d2DafF5e59284Fc10a39C862A53BF627D":
      "0x96f47A4FBBFE506e2EFC60a04E37dE82A8564e8C",
  })
);
