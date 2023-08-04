// Loads Metadata Transformer configuration from environment variables.
// This is the single point of entry for all server configuration. All environment variables used to
// configure the Metadata Transformer and all constants used in the code should be defined here.

import { Web3 } from "web3";

const PORT_RAW = process.env.METADATA_TRANSFORMER_PORT || "6374";
const PORT = Number(PORT_RAW);

const WEB3_PROVIDER_URI = process.env.METADATA_TRANSFORMER_WEB3_PROVIDER_URI;
if (!WEB3_PROVIDER_URI) {
  throw new Error("Please set the METADATA_TRANSFORMER_WEB3_PROVIDER_URI");
}
const web3 = new Web3(new Web3.providers.HttpProvider(WEB3_PROVIDER_URI));

export { PORT, web3 };
