import { Id } from '@graphprotocol/grc-20';
import type { Mapping } from '@graphprotocol/hypergraph';

export const mapping: Mapping = {
  Account: {
    typeIds: [Id.Id('cb69723f-7456-471a-a8ad-3e93ddc3edfe')],
    properties: {
      name: Id.Id('a126ca53-0c8e-48d5-b888-82c734c38935'),
      description: Id.Id('9b1f76ff-9711-404c-861e-59dc3fa7d037'),
      address: Id.Id('85cebdf1-d84f-4afd-993b-35f182096b59'),
    },
  },
  WorldID: {
    typeIds: [Id.Id('bf6ec302-be49-48ba-ae8d-a09be21bfca9')],
    properties: {
      address: Id.Id('7fd3c8da-1dce-4b49-8dd4-6b4fb76965ae'),
      timestamp: Id.Id('030cb05e-b958-422a-9267-916de05294e0'),
      type: Id.Id('abe6a538-8acb-473f-9fc5-d1f078dae511'),
    },
  },
  SelfID: {
    typeIds: [Id.Id('25bc2951-85ac-4c46-aae6-da37dc53beaa')],
    properties: {
      address: Id.Id('192b89f8-3d42-4f6d-9650-ddab66176b70'),
      did: Id.Id('03b50171-ee4a-445f-9ffa-6f9bf7591dbf'),
    },
  },
  VCProof: {
    typeIds: [Id.Id('9c17e5df-b0db-4d76-a831-72d30f3cade7')],
    properties: {
      proofHash: Id.Id('44909add-2340-4c9b-87a7-f59c6e9f2976'),
      issuer: Id.Id('a529b1f0-ad7b-4a01-8416-f617143e7857'),
      type: Id.Id('66dc70d5-35a1-489e-8505-c57cf099eec1'),
    },
  },
  TokenHolding: {
    typeIds: [Id.Id('0e78b4c8-4084-4262-ab57-84825d9893b8')],
    properties: {
      address: Id.Id('a62c1371-0abd-4aa6-9458-8cc8a9901fe1'),
      token: Id.Id('32480c7e-2edb-4d3b-a793-faa3508947ff'),
      amount: Id.Id('a8041b01-b65b-4171-abe0-6178b1f1aafb'),
      network: Id.Id('e2b1c137-b6a9-4d4b-9cf2-cda14c1130b8'),
    },
  },
  TransferEvents: {
    typeIds: [Id.Id('64c868cd-b2c2-430a-a605-36accf4d0184')],
    properties: {
      from: Id.Id('3298af48-5d5f-4d2f-9165-d7a0902cb9e0'),
      to: Id.Id('9a38da54-b137-4ae9-ab46-9ffb58694936'),
      token: Id.Id('b2074d40-bb50-45f1-a8c5-a2d390b0016f'),
      amount: Id.Id('21ef5e2b-1a30-4f18-b218-d78b047552af'),
      timestamp: Id.Id('9ce4ab80-24f3-46ec-ae62-6b8e3766b271'),
    },
  },
};
