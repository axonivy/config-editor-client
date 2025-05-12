import type { BrowserNode } from '@axonivy/ui-components';
import type { KnownVariables } from '@axonivy/variable-editor-protocol';
import { addNode } from '../../../utils/tree/tree-data';
import type { AddNodeReturnType, TreeNode } from '../../../utils/tree/types';
import { isMetadata, type Metadata } from '../data/metadata';
import { createVariable, type Variable } from '../data/variable';
import { nodeIcon } from '../data/variable-utils';

export const toNodes = (root?: KnownVariables): Array<BrowserNode> => {
  if (!root) {
    return [];
  }
  return root.children.map(varNode => toNode(varNode));
};

const toNode = (node: KnownVariables): BrowserNode => {
  const children = node.children.map(child => toNode(child));
  const icon = nodeIcon(node);
  const info = node.description;
  return {
    value: node.name,
    info,
    icon,
    data: node,
    children
  };
};

export const findVariable = <TNode extends TreeNode<TNode>>(node: TNode, ...key: Array<string>) => {
  const path = [];
  let currentNode: TNode | undefined = node;
  for (const part of key) {
    if (currentNode === undefined) {
      return undefined;
    }
    const index = currentNode.children.findIndex(child => child.name === part);
    currentNode = currentNode.children[index];
    if (currentNode === undefined) {
      return undefined;
    }
    path.push(index);
  }
  return { node: currentNode, path };
};

export const addKnownVariable = (variables: Array<Variable>, node: KnownVariables): AddNodeReturnType<Variable> => {
  const namespaceKey = node.namespace ? node.namespace.split('.') : [];
  const foundVariable = findVariable({ name: '', value: '', children: variables }, ...namespaceKey, node.name);
  let returnValue;
  if (!foundVariable) {
    returnValue = addKnown(variables, node);
  } else {
    returnValue = { newData: variables, newNodePath: foundVariable.path };
  }

  const newNodePath = returnValue.newNodePath;
  for (const child of node.children) {
    returnValue = addKnownVariable(returnValue.newData, child);
  }
  return { newData: returnValue.newData, newNodePath };
};

const addKnown = (variables: Array<Variable>, node: KnownVariables) => {
  let metadata: Metadata = { type: '' };
  const nodeMetaData = node.metaData;
  if (isMetadata(nodeMetaData)) {
    metadata = nodeMetaData;
  }
  return addNode(node.name, node.namespace, variables, name => {
    if (name === node.name) {
      return {
        name,
        value: node.value,
        children: [],
        description: node.description,
        metadata
      };
    }
    return createVariable(name);
  });
};
