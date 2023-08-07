import { ERC721Metadata } from "../data";

// The fresh transformer does nothing but return an empty ERC721Metadata object.
export default async function fresh(
  contractAddress: string,
  tokenID: string,
  baseMetadata?: ERC721Metadata
): Promise<ERC721Metadata> {
  return {
    name: "",
    description: "",
    image: "",
  };
}
