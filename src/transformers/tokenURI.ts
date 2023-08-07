import axios, { AxiosResponse } from "axios";

import { ERC721Metadata, Attribute } from "../data";
import { web3 } from "../settings";

export const TOKENURI_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// tokenURI is a special transformer in that it is intended to be able to supply the base metadata
// for any other transformer via the on-chain ERC721 tokenURI method.
// Although it contains logic to process the baseMetadata that's passed to it, it is not expected
// that this will be defined in practice.
// That said, you should feel free to use this as just another transformer.
export default async function tokenURI(
  contractAddress: string,
  tokenID: string,
  baseMetadata?: ERC721Metadata
): Promise<ERC721Metadata> {
  const erc721Contract = new web3.eth.Contract(TOKENURI_ABI, contractAddress);
  // @ts-ignore -- Typescript doesn't understand the variadic arguments to myContract.methods.myMethod.
  const uri: string = await erc721Contract.methods.tokenURI(tokenID).call();
  // TODO(zomglings): Handle data URIs
  const response: AxiosResponse = await axios.get(uri);
  const result: ERC721Metadata = baseMetadata || {
    name: "",
    description: "",
    image: "",
  };
  try {
    if (!!response.data.name) {
      result.name = response.data.name;
    }
    if (!!response.data.description) {
      result.description = response.data.description;
    }
    if (!!response.data.image) {
      result.image = response.data.image;
    }
    if (!!response.data.attributes) {
      if (!result.attributes) {
        result.attributes = [];
      }
      // TODO(zomglings): Deduplication of attributes.
      response.data.attributes.forEach((item: any) => {
        result.attributes?.push(item as Attribute);
      });
    }
  } catch (err) {
    console.error(
      `Error parsing metadata for contractAddress=${contractAddress}, tokenID=${tokenID}: ${err}`
    );
  }
  return result;
}
