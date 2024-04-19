import type { TreeNode, TreeNodeUpdate, TreeNodeUpdates } from '../../../utils/tree/types';
import type { Metadata } from './metadata';

export const variableDescriptionAttribute = 'description';
export const variableMetadataAttribute = 'metadata';

export interface Variable extends TreeNode<Variable> {
  description: string;
  metadata: Metadata;
}
export type VariableUpdate = TreeNodeUpdate<Variable>;
export type VariableUpdates = TreeNodeUpdates<Variable>;