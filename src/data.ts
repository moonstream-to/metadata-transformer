// The ERC721Metadata interface is a Typescript representation of the JSON schema for ERC721 metadata.
// It is consistent with the minimal schema defined in ERC721: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
// But it also accommodates fields (like "attributes") which are not defined in the original metadata
// schema but are commonly used in practice.
export interface ERC721Metadata {
  name: string;
  description: string;
  image: string;
  attributes?: Attribute[]; // Optional because it's not included in the original schema
}

// The Attribute interface is a Typescript representation for metadata attributes as consumed by
// applications like Open Sea: https://docs.opensea.io/docs/metadata-standards#attributes
export interface Attribute {
  trait_type: string;
  value: string | number;
}

// The MetadataTransformer type defines the interface that a metadata transformation must conform to.
// Note that a MetadataTransformer is expected to be asynchronous by default - even if you are writing
// a MetadataTransformer that only performs synchronous operations, you should still define it using the
// async keyword (or promisify or perform an equivalent operation).
export type MetadataTransformer = (
  contractAddress: string,
  tokenID: string,
  baseMetadata?: ERC721Metadata,
) => Promise<ERC721Metadata>;

// Chains together multiple transformers one after another, in the order specified.
export function chain(
  ...transformers: MetadataTransformer[]
): MetadataTransformer {
  return async function (
    contractAddress: string,
    tokenID: string,
    baseMetadata?: ERC721Metadata,
  ): Promise<ERC721Metadata> {
    let result: ERC721Metadata = baseMetadata || {
      name: "",
      description: "",
      image: "",
    };
    for (const transformer of transformers) {
      result = await transformer(contractAddress, tokenID, result);
    }
    return result;
  };
}
