// The ERC721Metadata interface is a Typescript representation of the JSON schema for ERC721 metadata.
// It is consistent with the minimal schema defined in ERC721: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
// But it also accommodates fields (like "attributes") which are not defined in the original metadata
// schema but are commonly used in practice.
interface ERC721Metadata {
    name: string;
    description: string;
    image: string;
    attributes?: Attribute[]; // Optional because it's not included in the original schema
}

// The Attribute interface is a Typescript representation for metadata attributes as consumed by
// applications like Open Sea: https://docs.opensea.io/docs/metadata-standards#attributes
interface Attribute {
    trait_type: string;
    value: string | number;
}
