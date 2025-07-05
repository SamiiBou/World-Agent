import {
  Graph,
  Ipfs,
  type Op,
  SystemIds,
  getWalletClient,
} from "@graphprotocol/grc-20";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Get environment variables
const addressPrivateKey = process.env.PRIVATE_KEY as `0x${string}`;
const addressEnv = process.env.ADDRESS as `0x${string}`;

if (!addressPrivateKey) {
  throw new Error("PRIVATE_KEY environment variable is required");
}

if (!addressEnv) {
  throw new Error("ADDRESS environment variable is required");
}

if (!addressEnv.startsWith("0x")) {
  throw new Error("ADDRESS must start with 0x");
}

// Type guard to ensure proper typing
function isValidAddress(addr: string): addr is `0x${string}` {
  return addr.startsWith("0x") && addr.length === 42;
}

if (!isValidAddress(addressEnv)) {
  throw new Error(
    "ADDRESS must be a valid Ethereum address (0x followed by 40 hex characters)"
  );
}

const address = addressEnv;

const ops: Op[] = [];

// create properties and type for type WorldID, SelfID, VCProof, TokenHolding, TransferEvents
function createTextProperty(name: string) {
  const { id, ops } = Graph.createProperty({ name, dataType: "TEXT" });
  return { id, ops };
}

function createNumberProperty(name: string) {
  const { id, ops } = Graph.createProperty({ name, dataType: "NUMBER" });
  return { id, ops };
}

// WorldID
const { id: worldAddressId, ops: worldAddressOps } =
  createTextProperty("address");
const { id: worldTimestampId, ops: worldTimestampOps } =
  createNumberProperty("timestamp");
const { id: worldProofTypeId, ops: worldProofTypeOps } =
  createTextProperty("type");
ops.push(...worldAddressOps, ...worldTimestampOps, ...worldProofTypeOps);

// SelfID
const { id: selfAddressId, ops: selfAddressOps } =
  createTextProperty("address");
const { id: selfDidId, ops: selfDidOps } = createTextProperty("did");
ops.push(...selfAddressOps, ...selfDidOps);

// VCProof
const { id: vcHashId, ops: vcHashOps } = createTextProperty("proofHash");
const { id: vcIssuerId, ops: vcIssuerOps } = createTextProperty("issuer");
const { id: vcTypeId, ops: vcTypeOps } = createTextProperty("type");
ops.push(...vcHashOps, ...vcIssuerOps, ...vcTypeOps);

// TokenHolding
const { id: tokenHolderId, ops: tokenHolderOps } =
  createTextProperty("address");
const { id: tokenId, ops: tokenOps } = createTextProperty("token");
const { id: tokenAmountId, ops: tokenAmountOps } =
  createNumberProperty("amount");
const { id: tokenNetworkId, ops: tokenNetworkOps } =
  createTextProperty("network");
ops.push(...tokenHolderOps, ...tokenOps, ...tokenAmountOps, ...tokenNetworkOps);

// TransferEvents
const { id: txFromId, ops: txFromOps } = createTextProperty("from");
const { id: txToId, ops: txToOps } = createTextProperty("to");
const { id: txTokenId, ops: txTokenOps } = createTextProperty("token");
const { id: txAmountId, ops: txAmountOps } = createNumberProperty("amount");
const { id: txTimestampId, ops: txTimestampOps } =
  createNumberProperty("timestamp");
ops.push(
  ...txFromOps,
  ...txToOps,
  ...txTokenOps,
  ...txAmountOps,
  ...txTimestampOps
);

// WorldID Type
console.log("WorldID Properties:");
console.log("address property ID:", worldAddressId);
console.log("timestamp property ID:", worldTimestampId);
console.log("type property ID:", worldProofTypeId);

const { id: worldIDTypeId, ops: worldIDTypeOps } = Graph.createType({
  name: "WorldID",
  properties: [worldAddressId, worldTimestampId, worldProofTypeId],
});
ops.push(...worldIDTypeOps);
console.log("WorldID Type:", worldIDTypeId);

// SelfID Type
console.log("SelfID Properties:");
console.log("address property ID:", selfAddressId);
console.log("did property ID:", selfDidId);

const { id: selfIDTypeId, ops: selfIDTypeOps } = Graph.createType({
  name: "SelfID",
  properties: [selfAddressId, selfDidId],
});
ops.push(...selfIDTypeOps);
console.log("SelfID Type:", selfIDTypeId);

// VCProof Type
console.log("VCProof Properties:");
console.log("proofHash property ID:", vcHashId);
console.log("issuer property ID:", vcIssuerId);
console.log("type property ID:", vcTypeId);

const { id: vcProofTypeId, ops: vcProofTypeOps } = Graph.createType({
  name: "VCProof",
  properties: [vcHashId, vcIssuerId, vcTypeId],
});
ops.push(...vcProofTypeOps);
console.log("VCProof Type:", vcProofTypeId);

// TokenHolding Type
console.log("TokenHolding Properties:");
console.log("address property ID:", tokenHolderId);
console.log("token property ID:", tokenId);
console.log("amount property ID:", tokenAmountId);
console.log("network property ID:", tokenNetworkId);

const { id: tokenHoldingTypeId, ops: tokenHoldingTypeOps } = Graph.createType({
  name: "TokenHolding",
  properties: [tokenHolderId, tokenId, tokenAmountId, tokenNetworkId],
});
ops.push(...tokenHoldingTypeOps);
console.log("TokenHolding Type:", tokenHoldingTypeId);

// TransferEvents Type
console.log("TransferEvents Properties:");
console.log("from property ID:", txFromId);
console.log("to property ID:", txToId);
console.log("token property ID:", txTokenId);
console.log("amount property ID:", txAmountId);
console.log("timestamp property ID:", txTimestampId);

const { id: transferEventsTypeId, ops: transferEventsTypeOps } =
  Graph.createType({
    name: "TransferEvents",
    properties: [txFromId, txToId, txTokenId, txAmountId, txTimestampId],
  });
ops.push(...transferEventsTypeOps);
console.log("TransferEvents Type:", transferEventsTypeId);

const smartAccountWalletClient = await getWalletClient({
  privateKey: addressPrivateKey,
});

const { id: spaceId } = await Graph.createSpace({
  editorAddress: address,
  name: "eth-global-hackathon-2025 v2",
  network: "TESTNET",
});

console.log("spaceId", spaceId);

const { cid } = await Ipfs.publishEdit({
  name: "Create properties and types",
  ops: ops,
  author: address,
  network: "TESTNET", // optional, defaults to MAINNET
});

const result = await fetch(
  `https://hypergraph-v2-testnet.up.railway.app/space/${spaceId}/edit/calldata`,
  {
    method: "POST",
    body: JSON.stringify({ cid }),
  }
);

console.log("edit result", result);

const editResultJson = await result.json();
console.log("editResultJson", editResultJson);
const { to, data } = editResultJson;

console.log("to", to);
console.log("data", data);

const txResult = await smartAccountWalletClient.sendTransaction({
  // @ts-expect-error - TODO: fix the types error
  account: smartAccountWalletClient.account,
  to: to,
  value: 0n,
  data: data,
});

console.log("txResult", txResult);
