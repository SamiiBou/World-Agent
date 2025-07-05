import { Entity, Type } from '@graphprotocol/hypergraph';

export class WorldID extends Entity.Class<WorldID>('WorldID')({
  address: Type.Text,
  timestamp: Type.Number,
  type: Type.Text,
}) {}

export class SelfID extends Entity.Class<SelfID>('SelfID')({
  address: Type.Text,
  did: Type.Text,
}) {}

export class VCProof extends Entity.Class<VCProof>('VCProof')({
  proofHash: Type.Text,
  issuer: Type.Text,
  type: Type.Text,
}) {}

export class TokenHolding extends Entity.Class<TokenHolding>('TokenHolding')({
  address: Type.Text,
  token: Type.Text,
  amount: Type.Number,
  network: Type.Text,
}) {}

export class TransferEvents extends Entity.Class<TransferEvents>('TransferEvents')({
  from: Type.Text,
  to: Type.Text,
  token: Type.Text,
  amount: Type.Number,
  timestamp: Type.Number,
}) {}
