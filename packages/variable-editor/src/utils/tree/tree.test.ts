import { createRow } from '@tanstack/react-table';
import { setupData, setupSearchData, setupTable } from './test-utils/setup';
import {
  deleteFirstSelectedRow,
  getPathOfRow,
  keyOfFirstSelectedNonLeafRow,
  keyOfRow,
  keysOfAllNonLeafRows,
  newNodeName,
  subRowNamesOfRow,
  toRowId,
  toTreePath,
  treeGlobalFilter
} from './tree';

const newNode = {
  name: 'newNodeName',
  value: 'newNodeValue',
  children: []
};

describe('deleteFirstSelectedRow', () => {
  describe('selection', () => {
    describe('root', () => {
      test('default', () => {
        const { data, table, onRowSelectionChangeValues } = setupTable();
        const originalData = structuredClone(data);
        table.getState().rowSelection = { '0': true };
        const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
        const newData = deleteFirstSelectedRowReturnValue.newData;
        const selectedPath = deleteFirstSelectedRowReturnValue.selectedPath;
        expect(data).toEqual(originalData);
        expect(newData).not.toBe(data);
        expect(selectedPath).toEqual([0]);
        expect(newData).toHaveLength(1);
        expect(newData[0]).toEqual(originalData[1]);
        expect(onRowSelectionChangeValues).toEqual([{ '0': true }]);
      });

      test('lastChildInListOfChildren', () => {
        const { data, table, onRowSelectionChangeValues } = setupTable();
        const originalData = structuredClone(data);
        table.getState().rowSelection = { '1': true };
        const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
        const newData = deleteFirstSelectedRowReturnValue.newData;
        const selectedPath = deleteFirstSelectedRowReturnValue.selectedPath;
        expect(data).toEqual(originalData);
        expect(newData).not.toBe(data);
        expect(selectedPath).toEqual([0]);
        expect(newData).toHaveLength(1);
        expect(newData[0]).toEqual(originalData[0]);
        expect(onRowSelectionChangeValues).toEqual([{ '0': true }]);
      });

      test('lastRemainingChild', () => {
        const { table, onRowSelectionChangeValues } = setupTable();
        const data = [{ name: 'NameNode0', value: 'ValueNode0', children: [] }];
        const originalData = structuredClone(data);
        table.getState().rowSelection = { '0': true };
        const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
        const newData = deleteFirstSelectedRowReturnValue.newData;
        const selectedPath = deleteFirstSelectedRowReturnValue.selectedPath;
        expect(data).toEqual(originalData);
        expect(newData).not.toBe(data);
        expect(selectedPath).toEqual([]);
        expect(newData).toHaveLength(0);
        expect(onRowSelectionChangeValues).toEqual([{}]);
      });
    });

    describe('deep', () => {
      test('default', () => {
        const { data, table, onRowSelectionChangeValues } = setupTable();
        const originalData = structuredClone(data);
        table.getState().rowSelection = { '1.0': true };
        const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
        const newData = deleteFirstSelectedRowReturnValue.newData;
        const selectedPath = deleteFirstSelectedRowReturnValue.selectedPath;
        expect(data).toEqual(originalData);
        expect(newData).not.toBe(data);
        expect(selectedPath).toEqual([1, 0]);
        expect(newData[1]?.children).toHaveLength(1);
        expect(newData[1]?.children[0]).toEqual(originalData[1]?.children[1]);
        expect(onRowSelectionChangeValues).toEqual([{ '1.0': true }]);
      });

      test('lastChildInListOfChildren', () => {
        const { data, table, onRowSelectionChangeValues } = setupTable();
        const originalData = structuredClone(data);
        table.getState().rowSelection = { '1.1': true };
        const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
        const newData = deleteFirstSelectedRowReturnValue.newData;
        const selectedPath = deleteFirstSelectedRowReturnValue.selectedPath;
        expect(data).toEqual(originalData);
        expect(newData).not.toBe(data);
        expect(selectedPath).toEqual([1, 0]);
        expect(newData[1]?.children).toHaveLength(1);
        expect(newData[1]?.children[0]).toEqual(originalData[1]?.children[0]);
        expect(onRowSelectionChangeValues).toEqual([{ '1.0': true }]);
      });

      test('lastRemainingChild', () => {
        const { data, table, onRowSelectionChangeValues } = setupTable();
        const originalData = structuredClone(data);
        table.getState().rowSelection = { '1.1.0': true };
        const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
        const newData = deleteFirstSelectedRowReturnValue.newData;
        const selectedPath = deleteFirstSelectedRowReturnValue.selectedPath;
        expect(data).toEqual(originalData);
        expect(newData).not.toBe(data);
        expect(selectedPath).toEqual([1, 1]);
        expect(newData[1]?.children[1]?.children).toHaveLength(0);
        expect(onRowSelectionChangeValues).toEqual([{ '1.1': true }]);
      });
    });
  });

  test('noSelection', () => {
    const { data, table, onRowSelectionChangeValues } = setupTable();
    const originalData = structuredClone(data);
    table.getState().rowSelection = {};
    const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
    const newData = deleteFirstSelectedRowReturnValue.newData;
    const selectedPath = deleteFirstSelectedRowReturnValue.selectedPath;
    expect(data).toEqual(originalData);
    expect(newData).not.toBe(data);
    expect(selectedPath).toEqual([]);
    expect(newData).toEqual(data);
    expect(onRowSelectionChangeValues).toEqual([]);
  });
});

describe('getPathOfRow', () => {
  test('singleDigit', () => {
    const { table } = setupTable();
    expect(getPathOfRow(createRow(table, '1', newNode, 1, 0))).toEqual([1]);
  });

  test('multipleDigits', () => {
    const { table } = setupTable();
    expect(getPathOfRow(createRow(table, '1.3.2', newNode, 1, 0))).toEqual([1, 3, 2]);
  });

  test('missing', () => {
    expect(getPathOfRow(undefined)).toEqual([]);
  });
});

test('toTreePath', () => {
  expect(toTreePath('')).toEqual([]);
  expect(toTreePath('42')).toEqual([42]);
  expect(toTreePath('4.2.0')).toEqual([4, 2, 0]);
});

describe('toRowId', () => {
  test('default', () => {
    expect(toRowId([1, 3, 3, 7])).toEqual('1.3.3.7');
  });

  test('empty', () => {
    expect(toRowId([])).toEqual('');
  });
});

describe('treeGlobalFilter', () => {
  describe('true', () => {
    test('inParentName', () => {
      const data = setupSearchData();
      expect(treeGlobalFilter(data, [0, 0], 'fOrPaReNtNa')).toBeTruthy();
    });

    test('inNodeName', () => {
      const data = setupSearchData();
      expect(treeGlobalFilter(data, [0, 0], 'fOrChIlDnA')).toBeTruthy();
    });

    test('inNodeValue', () => {
      const data = setupSearchData();
      expect(treeGlobalFilter(data, [0, 0], 'fOrChIlDvAl')).toBeTruthy();
    });
  });

  describe('false', () => {
    test('noMatch', () => {
      const data = setupData();
      expect(treeGlobalFilter(data, [2, 0], 'noMatch')).toBeFalsy();
    });

    test('pathEmpty', () => {
      const data = setupData();
      expect(treeGlobalFilter(data, [], 'pathEmpty')).toBeFalsy();
    });
  });
});

describe('keyOfRow', () => {
  test('withoutParents', () => {
    const { table } = setupTable();
    expect(keyOfRow(table.getRowModel().rows[0]!)).toEqual('NameNode0');
  });

  test('withParents', () => {
    const { table } = setupTable();
    expect(keyOfRow(table.getRowModel().rows[1]!.getLeafRows()[1]!.getLeafRows()[0]!)).toEqual('NameNode1.NameNode11.NameNode110');
  });
});

describe('newNodeName', () => {
  test('noSelection', () => {
    const { table } = setupTable();
    table.getState().rowSelection = {};
    expect(newNodeName(table, 'NewName')).toEqual('NewName');
    table.getRowModel().rows[0]!.original.name = 'NewName';
    expect(newNodeName(table, 'NewName')).toEqual('NewName2');
    table.getRowModel().rows[1]!.original.name = 'NewName2';
    expect(newNodeName(table, 'NewName')).toEqual('NewName3');
  });

  test('folderSelection', () => {
    const { table } = setupTable();
    table.getState().rowSelection = { '1.1': true };
    expect(newNodeName(table, 'NewName')).toEqual('NewName');
    table.getRowModel().rows[1]!.subRows[1]!.subRows[0]!.original.name = 'NewName';
    expect(newNodeName(table, 'NewName')).toEqual('NewName2');
  });

  test('rootLeafSelection', () => {
    const { table } = setupTable();
    table.getState().rowSelection = { '0': true };
    expect(newNodeName(table, 'NewName')).toEqual('NewName');
    table.getRowModel().rows[0]!.original.name = 'NewName';
    expect(newNodeName(table, 'NewName')).toEqual('NewName2');
  });

  test('leafSelection', () => {
    const { table } = setupTable();
    table.getState().rowSelection = { '1.1.0.0': true };
    expect(newNodeName(table, 'NewName')).toEqual('NewName');
    table.getRowModel().rows[1].subRows[1].subRows[0].subRows[0].original.name = 'NewName';
    expect(newNodeName(table, 'NewName')).toEqual('NewName2');
  });
});

describe('keyOfFirstSelectedNonLeafRow', () => {
  test('noSelection', () => {
    const { table } = setupTable();
    table.getState().rowSelection = {};
    expect(keyOfFirstSelectedNonLeafRow(table)).toEqual('');
  });

  test('folderSelection', () => {
    const { table } = setupTable();
    table.getState().rowSelection = { '1.1': true };
    expect(keyOfFirstSelectedNonLeafRow(table)).toEqual('NameNode1.NameNode11');
  });

  test('rootLeafSelection', () => {
    const { table } = setupTable();
    table.getState().rowSelection = { '0': true };
    expect(keyOfFirstSelectedNonLeafRow(table)).toEqual('');
  });

  test('leafSelection', () => {
    const { table } = setupTable();
    table.getState().rowSelection = { '1.1.0.0': true };
    expect(keyOfFirstSelectedNonLeafRow(table)).toEqual('NameNode1.NameNode11.NameNode110');
  });
});

test('keysOfAllNonLeafRows', () => {
  const { table } = setupTable();
  expect(keysOfAllNonLeafRows(table)).toEqual(['NameNode1', 'NameNode1.NameNode11', 'NameNode1.NameNode11.NameNode110']);
});

describe('subRowNamesOfRow', () => {
  test('root', () => {
    const { table } = setupTable();
    expect(subRowNamesOfRow('', table)).toEqual(['NameNode0', 'NameNode1']);
  });

  test('singlePart', () => {
    const { table } = setupTable();
    expect(subRowNamesOfRow('NameNode1', table)).toEqual(['NameNode10', 'NameNode11']);
  });

  test('multipleParts', () => {
    const { table } = setupTable();
    expect(subRowNamesOfRow('NameNode1.NameNode11.NameNode110', table)).toEqual(['NameNode1100']);
  });

  test('notPresent', () => {
    const { table } = setupTable();
    expect(subRowNamesOfRow('This.Key.Is.Not.Present', table)).toEqual([]);
  });
});
