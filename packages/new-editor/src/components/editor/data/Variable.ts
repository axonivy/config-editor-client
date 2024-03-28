export interface Variable {
  name: string;
  value: string;
  description: string;
  metadata: Metadata | undefined;
  children: Array<Variable>;
}

export enum Metadata {
  Password,
  Daytime,
  Enum,
  File
}
