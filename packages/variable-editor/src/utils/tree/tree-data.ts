import type { AddNodeReturnType, TreeNode, TreeNodeFactory, TreeNodeUpdates, TreePath } from './types';

export const getNode = <TNode extends TreeNode<TNode>>(data: Array<TNode>, path?: TreePath) => {
  const nodes = getNodesOnPath(data, path);
  return nodes.at(-1);
};

const getParentNode = <TNode extends TreeNode<TNode>>(data: Array<TNode>, path?: TreePath) => {
  const nodes = getNodesOnPath(data, path);
  return nodes.at(-2);
};

export const getNodesOnPath = <TNode extends TreeNode<TNode>>(data: Array<TNode>, path?: TreePath): Array<TNode | undefined> => {
  if (!path || path.length === 0) {
    return [];
  }
  return getNodesOnPathRecursive(data, [...path]);
};

const getNodesOnPathRecursive = <TNode extends TreeNode<TNode>>(data: Array<TNode>, path: TreePath): Array<TNode | undefined> => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const node = data[path.shift()!];
  if (path.length === 0) {
    return [node];
  }
  if (!node) {
    return [undefined];
  }
  return [node, ...getNodesOnPathRecursive(node.children, path)];
};

export const updateNode = <TNode extends TreeNode<TNode>>(data: Array<TNode>, path: TreePath, updates: TreeNodeUpdates<TNode>) => {
  const newData = structuredClone(data);
  const node = getNode(newData, path);
  if (!node) {
    return newData;
  }
  updates.forEach(update => (node[update.key] = update.value));
  return newData;
};

export const addNode = <TNode extends TreeNode<TNode>>(
  name: string,
  key: string,
  data: Array<TNode>,
  treeNodeFactory: TreeNodeFactory<TNode>
): AddNodeReturnType<TNode> => {
  const newData = structuredClone(data);
  let currentChildren = newData;
  const newNodePath: TreePath = [];

  if (key !== '') {
    for (const keyPart of key.split('.')) {
      const nextNodeIndex = currentChildren.findIndex(node => node.name === keyPart);
      const nextNode = currentChildren[nextNodeIndex];
      if (nextNode === undefined) {
        currentChildren = pushNewNode(currentChildren, treeNodeFactory(keyPart), newNodePath);
      } else {
        newNodePath.push(nextNodeIndex);
        currentChildren = nextNode.children;
      }
    }
  }

  pushNewNode(currentChildren, treeNodeFactory(name), newNodePath);
  return { newData: newData, newNodePath: newNodePath };
};

const pushNewNode = <TNode extends TreeNode<TNode>>(nodes: Array<TNode>, newNode: TNode, newNodePath: TreePath) => {
  newNodePath.push(nodes.length);
  nodes.push(newNode);
  return newNode.children;
};

export const removeNode = <TNode extends TreeNode<TNode>>(data: Array<TNode>, path: TreePath) => {
  const newData = structuredClone(data);
  const children = getChildrenContainingNode(newData, path);
  if (!children) {
    return newData;
  }
  const childIndex = path.at(-1);
  if (childIndex === undefined) {
    return newData;
  }
  children.splice(childIndex, 1);
  return newData;
};

const getChildrenContainingNode = <TNode extends TreeNode<TNode>>(data: Array<TNode>, path: TreePath) => {
  if (path.length === 1) {
    return data;
  }
  const parent = getParentNode(data, path);
  if (!parent) {
    return;
  }
  return parent.children;
};

export const hasChildren = <TNode extends TreeNode<TNode>>(node: TNode) => {
  return node.children.length !== 0;
};
