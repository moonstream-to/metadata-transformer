# Metadata Transformer

The Metadata Transformer is a self-hostable metadata server for web3 games.

Starting with [ERC721](https://eips.ethereum.org/EIPS/eip-721), NFT projects have been using JSON-based,
_offchain_ metadata to describe their tokens. Web3 games have started using this metadata to reflect the
game states of their NFTs - characters, lands, items, and more. This makes it impossible for smart contracts
to consume the state of game assets without relying on oracles.

We believe that the current state of affairs is broken. We believe that the blockchain should be the
source of truth for the game state of _web3_ game assets. That web3 games should use on-chain systems
like [`Inventory`](https://github.com/lootlocker/inventory) and [`StatBlock`](https://github.com/moonstream-to/web3)
to represent the state of their game assets.

We also recognize that it should be easy for off-chain clients to consume the state of game assets. While
the blockchain should be the source of truth about the state of these assets, users of those assets
should not be forced to interact with the blockchain to read their state. Marketplaces and other applications
should not be forced to understand the custom ins and outs of a particular game's on-chain state representation
to display the game's sassets. The JSON metadata specification deserves respect.

The Metadata Transformer allows games to make the blockchain their source of truth for game state while
simultaneously playing nicely with off-chain consumers of their data (marketplaces, rental protocols, lending protocols, etc.).
Games can host an instance of the Metadata Transformer which is configured to read the on-chain state of
their game assets and, from this, construct a JSON representation of these assets that conforms to the
metadata specifications that those consumers expect.

The Metadata Transformer is built as a [Node.js library](https://nodejs.org/en) which can be used to
configure an [`express`](https://expressjs.com/) app. It is built in [Typescript](https://www.typescriptlang.org/).

## Getting Started

### Installation

```bash
npm install metadata-transformer
```

### Usage

You are assumed to start with an [`express`](https://expressjs.com) application:

```typescript
import express from "express";

const app = express();
```

You can configure this `express` application to serve Metadata Transformer endpoints as follows:

```typescript
import metadataTransformer from "metadata-transformer";

metadataTransformer(app);
```

This sets your application up to serve the following endpoints (all `GET` requests):

- `/status` - returns the status of the Metadata Transformer server
- `/raw/:contractAddress/:tokenID` - returns the base metadata for the NFT at the given `:contractAddress`
  with the given `:tokenID`
- `/transformed/:contractAddress/:tokenID` - returns the transformed metadata for the NFT at the given `:contractAddress`
  with the given `:tokenID`

### Examples

#### Polygon Inventories

For an example, see [`src/servers/polygonInventories.ts`](./src/servers/polygonInventories.ts). This
Metadata Transformer server enriches a token's on-chain metadata (as returned by the `tokenURI` ERC721
view method) with information about the items equipped in its on-chain Inventory.

To run this server locally:

```bash
npm run polygon-inventories
```

You can see this in action with the Crypto-Guilds Heroes NFT collection. By default, Heroes have very
simple metadata:

```bash
curl -s localhost:6374/raw/0xC740674d2DafF5e59284Fc10a39C862A53BF627D/42 | jq .
```

Returns:

```json
{
  "name": "CG Hero #42",
  "description": "Crypto-Guilds Meta Game offers an exciting cross-metaverse adventure where CG Heroes embark on quests across various games, earning valuable rewards, collecting badges, and acquiring powerful equipment. By upgrading their Heroes with SBTs (Soulbound Tokens) and NFTs (Non-Fungible Tokens), players can enhance their Hero Score, unlocking even greater opportunities to earn from the expansive pool of rewards. The Hero Score serves as a measure of a player's progress and potential earnings within the game.",
  "image": "https://badges.moonstream.to/crypto-guilds/heroes/PJ3.png"
}
```

But the Metadata Transformer enriches this with information about the items that each Hero has equipped
in its inventory slots:

```bash
curl -s localhost:6374/transformed/0xC740674d2DafF5e59284Fc10a39C862A53BF627D/42 | jq .
```

Returns:

```json
{
  "name": "CG Hero #42",
  "description": "Crypto-Guilds Meta Game offers an exciting cross-metaverse adventure where CG Heroes embark on quests across various games, earning valuable rewards, collecting badges, and acquiring powerful equipment. By upgrading their Heroes with SBTs (Soulbound Tokens) and NFTs (Non-Fungible Tokens), players can enhance their Hero Score, unlocking even greater opportunities to earn from the expansive pool of rewards. The Hero Score serves as a measure of a player's progress and potential earnings within the game.",
  "image": "https://badges.moonstream.to/crypto-guilds/heroes/PJ3.png",
  "attributes": [
    {
      "trait_type": "slot_0",
      "value": "0:0x0000000000000000000000000000000000000000:0:0"
    },
    {
      "trait_type": "slot_1",
      "value": "1155:0x9BB8B28B715c9D0C0098816E9fAFDD258554de8D:3:1"
    },
    {
      "trait_type": "slot_2",
      "value": "0:0x0000000000000000000000000000000000000000:0:0"
    },
    {
      "trait_type": "slot_3",
      "value": "0:0x0000000000000000000000000000000000000000:0:0"
    },
    {
      "trait_type": "slot_4",
      "value": "0:0x0000000000000000000000000000000000000000:0:0"
    },
    {
      "trait_type": "slot_5",
      "value": "0:0x0000000000000000000000000000000000000000:0:0"
    }
  ]
}
```

In this case, Hero `42` has an ERC`1155` token from address `0x9BB8B28B715c9D0C0098816E9fAFDD258554de8D` equipped in `slot_1`.
The token ID for the item is `3`, and the amout of those items is equipped in the slot is `1`.

The Polygon Inventories transformer also shows how to use a Redis cache to cache metadata and reduce the
number of RPC calls your transformer needs to make. To use this setting, you will need to be [running
a redis server locally on port 6379](https://redis.io). Set the environment variable
`export METADATA_TRANSFORMER_USE_REDIS=true`, and set also:

```bash
export METADATA_TRANSFORMER_CACHE_TTL_MILLIS=30000
export METADATA_TRANSFORMER_CACHE_TRACING=1
```

(See [`sample.env`](./sample.env))

The server logs will show how the cache is being used on the same requests above.

### Custom transformers

Metadata Transformer is intended to serve JSON metadata representing any on-chain state, no matter how
specific it is to your game or NFT collection. You can represent such custom state by writing your
own `MetadataTransformer` functions.

The `MetadataTransformer` type is defined in [`src/data.ts`](./src/data.ts) as:

```typescript
export type MetadataTransformer = (
  contractAddress: string,
  tokenID: string,
  baseMetadata?: ERC721Metadata
) => Promise<ERC721Metadata>;
```

For an example of how to implement a custom `MetadataTransformer`, see [`src/transformers/inventory.ts`](./src/transformers/inventory.ts).

## Support

Experiencing an issue with Metadata Transformer? [See if it's already been solved](https://github.com/moonstream-to/metadata-transformer/issues/new)
or [create an issue](https://github.com/moonstream-to/metadata-transformer/issues/new).

## Acknowledgments

The Metadata Transformer originally surfaced in this issue: https://github.com/moonstream-to/api/issues/834

The [EIP6551 `iframe` renderer](https://github.com/tokenbound/iframe) was a major inspiration for this project.

[`arevak`](https://github.com/arevak) gave very helpful early feedback, and most of his suggestions were incorporated
in [`v0.0.2`](https://github.com/moonstream-to/metadata-transformer/releases/tag/v0.0.2).
