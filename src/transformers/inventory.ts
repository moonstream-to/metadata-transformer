import { Web3 } from "web3";
import { ERC721Metadata, MetadataTransformer } from "../data";

// createInventoryTransformer generates a transformer which enriches ERC721 token metadata with the
// items that have been equipped in the token's inventory.
// To learn more about the Inventory contract: https://github.com/moonstream-to/web3
// createInventoryTransformer accepts an argument called `inventories`. This is expected to be a
// mapping from ERC721 contract addresses to corresponding Inventory contract addresses.
// The keys in `inventories` are exected to be checksummed addresses.
export function createInventoryTransformer(
  web3: Web3,
  inventories: Record<string, string>,
  multicallAddress?: string
): MetadataTransformer {
  // Normalization of keys (and values)
  for (let contractAddress in inventories) {
    inventories[web3.utils.toChecksumAddress(contractAddress)] =
      web3.utils.toChecksumAddress(inventories[contractAddress]);
  }

  // TODO(zomglings): Implement multicall logic if multicallAddress is defined.
  if (multicallAddress) {
    console.warn(
      "This transformer does not currently support Multicall functionality."
    );
  }

  return async function inventoryTransformer(
    contractAddress: string,
    tokenID: string,
    baseMetadata?: ERC721Metadata
  ): Promise<ERC721Metadata> {
    const result: ERC721Metadata = baseMetadata || {
      name: "",
      description: "",
      image: "",
    };

    if (!result.attributes) {
      result.attributes = [];
    }

    const normalizedContractAddress =
      web3.utils.toChecksumAddress(contractAddress);
    const inventoryContractAddress = inventories[normalizedContractAddress];
    if (inventoryContractAddress) {
      const inventory = new web3.eth.Contract(
        INVENTORY_ABI,
        inventoryContractAddress
      );
      const numSlots: bigint = await inventory.methods.numSlots().call();
      for (let slot = 0; slot < numSlots; slot++) {
        // TODO(zomglings): I think we should start using Typechain so that we avoid these kinds of
        // Typescript errors and issues.
        const equippedItem = await inventory.methods
          // @ts-ignore -- Typescript doesn't understand the variadic arguments to myContract.methods.myMethod.
          .getEquippedItem(tokenID, slot)
          .call();

        result.attributes.push({
          trait_type: `slot_${slot.toString()}`,
          value: `${equippedItem[0].toString()}:${
            equippedItem[1]
          }:${equippedItem[2].toString()}:${equippedItem[3].toString()}`,
        });
      }
    }

    return result;
  };
}

// TODO(zomglings): Cite the tag/commit from https://github.com/moonstream-to/web3 that this ABI was
// built from.
export const INVENTORY_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "subjectTokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "itemType",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "itemAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "itemTokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "equippedBy",
        type: "address",
      },
    ],
    name: "ItemEquipped",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "itemType",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "itemAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "itemPoolId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxAmount",
        type: "uint256",
      },
    ],
    name: "ItemMarkedAsEquippableInSlot",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "subjectTokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "itemType",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "itemAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "itemTokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "unequippedBy",
        type: "address",
      },
    ],
    name: "ItemUnequipped",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "slotId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "persistent",
        type: "bool",
      },
    ],
    name: "NewSlotPersistence",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "slotId",
        type: "uint256",
      },
    ],
    name: "NewSlotURI",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
    ],
    name: "NewSubjectAddress",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
    ],
    name: "SlotCreated",
    type: "event",
  },
  {
    inputs: [],
    name: "adminTerminusInfo",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "persistent",
        type: "bool",
      },
      {
        internalType: "string",
        name: "slotURI",
        type: "string",
      },
    ],
    name: "createSlot",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "subjectTokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "itemType",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "itemAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "itemTokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "equip",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "subjectTokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
    ],
    name: "getEquippedItem",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "ItemType",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "ItemAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "ItemTokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "Amount",
            type: "uint256",
          },
        ],
        internalType: "struct EquippedItem",
        name: "item",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "slotId",
        type: "uint256",
      },
    ],
    name: "getSlotById",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "SlotURI",
            type: "string",
          },
          {
            internalType: "bool",
            name: "SlotIsPersistent",
            type: "bool",
          },
        ],
        internalType: "struct Slot",
        name: "slots",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "slotId",
        type: "uint256",
      },
    ],
    name: "getSlotURI",
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
  {
    inputs: [
      {
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "itemType",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "itemAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "itemPoolId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxAmount",
        type: "uint256",
      },
    ],
    name: "markItemAsEquippableInSlot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "itemType",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "itemAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "itemPoolId",
        type: "uint256",
      },
    ],
    name: "maxAmountOfItemInSlot",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "numSlots",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "slotId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "persistent",
        type: "bool",
      },
    ],
    name: "setSlotPersistent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "newSlotURI",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "slotId",
        type: "uint256",
      },
    ],
    name: "setSlotURI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "slotId",
        type: "uint256",
      },
    ],
    name: "slotIsPersistent",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "subject",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "subjectTokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "unequipAll",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "unequip",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
