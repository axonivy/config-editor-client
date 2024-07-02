import { useTableGlobalFilter } from '@axonivy/ui-components';
import type { Row, Table } from '@tanstack/react-table';
import { getFirstSelectedRow, selectRow } from '../table/table';
import { addNode, getNode, getNodesOnPath, removeNode } from './tree-data';
import type { AddChildToFirstSelectedRowReturnType, DeleteFirstSelectedRowReturnType, TreeNode, TreePath } from './types';

export const addChildToFirstSelectedRow = <TNode extends TreeNode<TNode>>(
  table: Table<TNode>,
  data: Array<TNode>,
  newNode: TNode
): AddChildToFirstSelectedRowReturnType<TNode> => {
  const row = getFirstSelectedRow(table);
  const path = getPathOfRow(row);
  const addNodeReturnValue = addNode(data, path, newNode);
  const newData = addNodeReturnValue.newData;
  const newChildIndex = addNodeReturnValue.newChildIndex;
  const newChildId = toRowId([...path, newChildIndex]);
  selectRow(table, newChildId);
  return { newData: newData, selectedNode: getNode(newData, path), newChildPath: [...path, newChildIndex] };
};

export const deleteFirstSelectedRow = <TNode extends TreeNode<TNode>>(
  table: Table<TNode>,
  data: Array<TNode>
): DeleteFirstSelectedRowReturnType<TNode> => {
  const selectedRow = getFirstSelectedRow(table);
  const newData = removeNode(data, getPathOfRow(selectedRow));
  let selectedVariablePath: TreePath;
  if (!selectedRow) {
    selectedVariablePath = [];
  } else {
    selectedVariablePath = adjustSelectionAfterDeletionOfRow(newData, table, selectedRow);
  }
  return { newData: newData, selectedVariablePath: selectedVariablePath };
};

export const getPathOfRow = <TNode extends TreeNode<TNode>>(row?: Row<TNode>) => {
  if (!row) {
    return [];
  }
  return toTreePath(row.id);
};

const getPathOfParentRow = <TNode extends TreeNode<TNode>>(row?: Row<TNode>) => {
  if (!row || !row.parentId) {
    return [];
  }
  return toTreePath(row.parentId);
};

const adjustSelectionAfterDeletionOfRow = <TNode extends TreeNode<TNode>>(data: Array<TNode>, table: Table<TNode>, row: Row<TNode>) => {
  const parentPath = getPathOfParentRow(row);
  const parentNode = getNode(data, parentPath);
  const children = parentNode ? parentNode.children : data;
  const childIndex = row.index;

  let selectedRowPath;
  switch (children.length) {
    // node was the last remaining child of its parent -> select parent
    case 0:
      selectedRowPath = parentPath;
      break;
    // node is the last child in the list of children of its parent -> select previous child
    case childIndex:
      selectedRowPath = [...parentPath, childIndex - 1];
      break;
    // default case -> select next child
    default:
      selectedRowPath = [...parentPath, childIndex];
      break;
  }
  selectRow(table, toRowId(selectedRowPath));
  return selectedRowPath;
};

const toTreePath = (rowId: string) => {
  return rowId.split('.').map(index => Number(index));
};

const toRowId = (path: TreePath) => {
  return path.join('.');
};

export const useTreeGlobalFilter = <TNode extends TreeNode<TNode>>(data: Array<TNode>) => {
  const globalFilter = useTableGlobalFilter();
  const globalFilterFn = (row: Row<TNode>, _columnId: string, filterValue: string) =>
    treeGlobalFilter(data, toTreePath(row.id), filterValue);
  return { ...globalFilter, options: { ...globalFilter.options, globalFilterFn: globalFilterFn, filterFromLeafRows: true } };
};

export const treeGlobalFilter = <TNode extends TreeNode<TNode>>(data: Array<TNode>, path: TreePath, filterValue: string) => {
  filterValue = filterValue.toLowerCase();
  const nodesOnPath = getNodesOnPath(data, path);
  for (const node of nodesOnPath) {
    if (node?.name.toLowerCase().includes(filterValue)) {
      return true;
    }
  }
  const node = nodesOnPath.at(-1);
  if (node) {
    return node.value.toLowerCase().includes(filterValue);
  }
  return false;
};

export const keyOfFirstSelectedNonLeafRow = <TNode extends TreeNode<TNode>>(table: Table<TNode>) => {
  const row = firstSelectedNonLeafRow(table);
  if (row) {
    return keyOfRow(row);
  }
  return '';
};

const firstSelectedNonLeafRow = <TNode extends TreeNode<TNode>>(table: Table<TNode>) => {
  const selectedRow = getFirstSelectedRow(table);
  if (!selectedRow) {
    return;
  }
  if (hasChildren(selectedRow)) {
    return selectedRow;
  }

  const parentRow = selectedRow.getParentRow();
  if (!parentRow) {
    return;
  }
  return parentRow;
};

export const keysOfAllNonLeafRows = <TNode extends TreeNode<TNode>>(table: Table<TNode>) => {
  return table.getRowModel().flatRows.filter(hasChildren).map(keyOfRow);
};

const hasChildren = <TNode extends TreeNode<TNode>>(row: Row<TNode>) => {
  return row.subRows.length !== 0;
};

export const keyOfRow = <TNode extends TreeNode<TNode>>(row: Row<TNode>) => {
  const parentKey = keyOfParentRows(row);
  if (parentKey !== '') {
    return parentKey + '.' + row.original.name;
  }
  return row.original.name;
};

const keyOfParentRows = <TNode extends TreeNode<TNode>>(row: Row<TNode>) => {
  return row
    .getParentRows()
    .map(parentRow => parentRow.original.name)
    .join('.');
};
