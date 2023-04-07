import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  toBigNumber,
} from "@metaplex-foundation/js";
import * as fs from "fs";
import secret from "./guideSecret.json";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const SOLANA_CONNECTION = new Connection(RPC_ENDPOINT);

const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));

const METAPLEX = Metaplex.make(SOLANA_CONNECTION)
  .use(keypairIdentity(WALLET))
  .use(
    bundlrStorage({
      address: "https://devnet.bundlr.network",
      providerUrl: RPC_ENDPOINT,
      timeout: 60000,
    })
  );

const CONFIG = {
  uploadPath: "uploads/",
  imgFileName: "horseKing.png",
  imgType: "image/png",
  imgName: "Purple Horsey King",
  description: "The Purple Horsey King is a pixelated horse with a crown.",
  attributes: [
    { trait_type: "Eyes", value: "Black" },
    { trait_type: "Mouth", value: "Green" },
    { trait_type: "Crown", value: "Yellow" },
    { trait_type: "Horn", value: "Purple" },
    { trait_type: "Body", value: "Brown" },
  ],
  sellerFeeBasisPoints: 5000,
  symbol: "HRSE",
  creators: [{ address: WALLET.publicKey, share: 100 }],
};

async function uploadMetadata(
  imgUri: string,
  imgType: string,
  nftName: string,
  description: string,
  attributes: { trait_type: string; value: string }[]
) {
  const { uri } = await METAPLEX.nfts().uploadMetadata({
    name: nftName,
    description: description,
    image: imgUri,
    attributes: attributes,
    properties: {
      files: [
        {
          type: imgType,
          uri: imgUri,
        },
      ],
    },
  });
  console.log("   Metadata URI:", uri);
  return uri;
}

async function mintNft(
  metadataUri: string,
  name: string,
  sellerFee: number,
  symbol: string,
  creators: { address: PublicKey; share: number }[]
) {
  const { nft } = await METAPLEX.nfts().create({
    uri: metadataUri,
    name: name,
    sellerFeeBasisPoints: sellerFee,
    symbol: symbol,
    creators: creators,
    isMutable: false,
  });
  console.log(`   Success!🎉`);
  console.log(
    `   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`
  );
}

async function main() {
  console.log(
    `Minting ${
      CONFIG.imgName
    } to an NFT in Wallet ${WALLET.publicKey.toBase58()}.`
  );

  const metadataUri = await uploadMetadata(
    "https://d2brqszwzept5g.cloudfront.net/horseKing.png",
    CONFIG.imgType,
    CONFIG.imgName,
    CONFIG.description,
    CONFIG.attributes
  );

  await mintNft(
    metadataUri,
    CONFIG.imgName,
    CONFIG.sellerFeeBasisPoints,
    CONFIG.symbol,
    CONFIG.creators
  );
}

main()
  .then(() => console.log("Done"))
  .catch(console.error);
