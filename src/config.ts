// Loads Metadata Transformer configuration from environment variables.
// This is the single point of entry for all server configuration. All environment variables used to
// configure the Metadata Transformer and all constants used in the code should be defined here.

const PORT = process.env.METADATA_TRANSFORMER_PORT || 6374;

export { PORT };
