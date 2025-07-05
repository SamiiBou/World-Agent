import { Entity, Type } from '@graphprotocol/hypergraph';

export class AcademicField extends Entity.Class<AcademicField>('AcademicField')({
  name: Type.Text,
  description: Type.Text
}) {}