import type { RowSelectionState, Table, Updater } from '@tanstack/react-table';
import { createRow, createTable, getCoreRowModel } from '@tanstack/react-table';
import type { TestNode } from './test-utils/types';
import {
  deleteFirstSelectedRow,
  getPathOfRow,
  keyOfFirstSelectedNonLeafRow,
  keyOfRow,
  keysOfAllNonLeafRows,
  newNodeName,
  subRowNamesOfRow,
  toRowId,
  treeGlobalFilter
} from './tree';

let data: Array<TestNode>;
let newNode: TestNode;

let table: Table<TestNode>;
let onRowSelectionChangeValue: Updater<RowSelectionState>;

beforeEach(() => {
  data = [
    { name: 'NameNode0', value: 'ValueNode0', children: [] },
    {
      name: 'NameNode1',
      value: '',
      children: [
        { name: 'NameNode10', value: 'ValueNode10', children: [] },
        {
          name: 'NameNode11',
          value: '',
          children: [
            {
              name: 'NameNode110',
              value: '',
              children: [{ name: 'NameNode1100', value: 'ValueNode1100', children: [] }]
            }
          ]
        }
      ]
    },
    { name: 'SearchForParentName', value: '', children: [{ name: 'SearchForChildName', value: 'SearchForChildValue', children: [] }] }
  ];
  newNode = {
    name: 'newNodeName',
    value: 'newNodeValue',
    children: []
  };

  table = createTable({
    columns: [],
    data: data,
    getCoreRowModel: getCoreRowModel(),
    onStateChange: () => {},
    onRowSelectionChange: (value: Updater<RowSelectionState>) => {
      onRowSelectionChangeValue = value;
    },
    getSubRows: row => row.children,
    renderFallbackValue: undefined,
    state: {}
  });
  onRowSelectionChangeValue = {};
});

describe('tree', () => {
  describe('deleteFirstSelectedRow', () => {
    describe('selection', () => {
      describe('root', () => {
        test('default', () => {
          const originalData = structuredClone(data);
          table.getState().rowSelection = { '0': true };
          const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
          const newData = deleteFirstSelectedRowReturnValue.newData;
          const selectedVariablePath = deleteFirstSelectedRowReturnValue.selectedVariablePath;
          expect(data).toEqual(originalData);
          expect(newData).not.toBe(data);
          expect(selectedVariablePath).toEqual([0]);
          expect(newData).toHaveLength(2);
          expect(newData[0]).toEqual(originalData[1]);
          expect(newData[1]).toEqual(originalData[2]);
          expect(onRowSelectionChangeValue).toEqual({ '0': true });
        });

        test('lastChildInListOfChildren', () => {
          const originalData = structuredClone(data);
          table.getState().rowSelection = { '2': true };
          const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
          const newData = deleteFirstSelectedRowReturnValue.newData;
          const selectedVariablePath = deleteFirstSelectedRowReturnValue.selectedVariablePath;
          expect(data).toEqual(originalData);
          expect(newData).not.toBe(data);
          expect(selectedVariablePath).toEqual([1]);
          expect(newData).toHaveLength(2);
          expect(newData[0]).toEqual(originalData[0]);
          expect(newData[1]).toEqual(originalData[1]);
          expect(onRowSelectionChangeValue).toEqual({ '1': true });
        });

        test('lastRemainingChild', () => {
          data = [{ name: 'NameNode0', value: 'ValueNode0', children: [] }];
          const originalData = structuredClone(data);
          table.getState().rowSelection = { '0': true };
          onRowSelectionChangeValue = { '0': true };
          const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
          const newData = deleteFirstSelectedRowReturnValue.newData;
          const selectedVariablePath = deleteFirstSelectedRowReturnValue.selectedVariablePath;
          expect(data).toEqual(originalData);
          expect(newData).not.toBe(data);
          expect(selectedVariablePath).toEqual([]);
          expect(newData).toHaveLength(0);
          expect(onRowSelectionChangeValue).toEqual({});
        });
      });

      describe('deep', () => {
        test('default', () => {
          const originalData = structuredClone(data);
          table.getState().rowSelection = { '1.0': true };
          const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
          const newData = deleteFirstSelectedRowReturnValue.newData;
          const selectedVariablePath = deleteFirstSelectedRowReturnValue.selectedVariablePath;
          expect(data).toEqual(originalData);
          expect(newData).not.toBe(data);
          expect(selectedVariablePath).toEqual([1, 0]);
          expect(newData[1].children).toHaveLength(1);
          expect(newData[1].children[0]).toEqual(originalData[1].children[1]);
          expect(onRowSelectionChangeValue).toEqual({ '1.0': true });
        });

        test('lastChildInListOfChildren', () => {
          const originalData = structuredClone(data);
          table.getState().rowSelection = { '1.1': true };
          const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
          const newData = deleteFirstSelectedRowReturnValue.newData;
          const selectedVariablePath = deleteFirstSelectedRowReturnValue.selectedVariablePath;
          expect(data).toEqual(originalData);
          expect(newData).not.toBe(data);
          expect(selectedVariablePath).toEqual([1, 0]);
          expect(newData[1].children).toHaveLength(1);
          expect(newData[1].children[0]).toEqual(originalData[1].children[0]);
          expect(onRowSelectionChangeValue).toEqual({ '1.0': true });
        });

        test('lastRemainingChild', () => {
          const originalData = structuredClone(data);
          table.getState().rowSelection = { '1.1.0': true };
          const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
          const newData = deleteFirstSelectedRowReturnValue.newData;
          const selectedVariablePath = deleteFirstSelectedRowReturnValue.selectedVariablePath;
          expect(data).toEqual(originalData);
          expect(newData).not.toBe(data);
          expect(selectedVariablePath).toEqual([1, 1]);
          expect(newData[1].children[1].children).toHaveLength(0);
          expect(onRowSelectionChangeValue).toEqual({ '1.1': true });
        });
      });
    });

    test('noSelection', () => {
      const originalData = structuredClone(data);
      table.getState().rowSelection = {};
      const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, data);
      const newData = deleteFirstSelectedRowReturnValue.newData;
      const selectedVariablePath = deleteFirstSelectedRowReturnValue.selectedVariablePath;
      expect(data).toEqual(originalData);
      expect(newData).not.toBe(data);
      expect(selectedVariablePath).toEqual([]);
      expect(newData).toEqual(data);
      expect(onRowSelectionChangeValue).toEqual({});
    });
  });

  describe('getPathOfRow', () => {
    test('singleDigit', () => {
      expect(getPathOfRow(createRow(table, '1', newNode, 1, 0))).toEqual([1]);
    });

    test('multipleDigits', () => {
      expect(getPathOfRow(createRow(table, '1.3.2', newNode, 1, 0))).toEqual([1, 3, 2]);
    });

    test('missing', () => {
      expect(getPathOfRow(undefined)).toEqual([]);
    });
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
        expect(treeGlobalFilter(data, [2, 0], 'fOrPaReNtNa')).toBeTruthy();
      });

      test('inNodeName', () => {
        expect(treeGlobalFilter(data, [2, 0], 'fOrChIlDnA')).toBeTruthy();
      });

      test('inNodeValue', () => {
        expect(treeGlobalFilter(data, [2, 0], 'fOrChIlDvAl')).toBeTruthy();
      });
    });

    describe('false', () => {
      test('noMatch', () => {
        expect(treeGlobalFilter(data, [2, 0], 'noMatch')).toBeFalsy();
      });

      test('pathEmpty', () => {
        expect(treeGlobalFilter(data, [], 'pathEmpty')).toBeFalsy();
      });
    });
  });

  describe('keyOfRow', () => {
    test('withoutParents', () => {
      expect(keyOfRow(table.getRowModel().rows[0])).toEqual('NameNode0');
    });

    test('withParents', () => {
      expect(keyOfRow(table.getRowModel().rows[1].getLeafRows()[1].getLeafRows()[0])).toEqual('NameNode1.NameNode11.NameNode110');
    });
  });

  describe('newNodeName', () => {
    test('noSelection', () => {
      table.getState().rowSelection = {};
      expect(newNodeName(table, 'NewName')).toEqual('NewName');
      table.getRowModel().rows[0].original.name = 'NewName';
      expect(newNodeName(table, 'NewName')).toEqual('NewName2');
      table.getRowModel().rows[1].original.name = 'NewName2';
      expect(newNodeName(table, 'NewName')).toEqual('NewName3');
    });

    test('folderSelection', () => {
      table.getState().rowSelection = { '1.1': true };
      expect(newNodeName(table, 'NewName')).toEqual('NewName');
      table.getRowModel().rows[1].subRows[1].subRows[0].original.name = 'NewName';
      expect(newNodeName(table, 'NewName')).toEqual('NewName2');
    });

    test('rootLeafSelection', () => {
      table.getState().rowSelection = { '0': true };
      expect(newNodeName(table, 'NewName')).toEqual('NewName');
      table.getRowModel().rows[0].original.name = 'NewName';
      expect(newNodeName(table, 'NewName')).toEqual('NewName2');
    });

    test('leafSelection', () => {
      table.getState().rowSelection = { '1.1.0.0': true };
      expect(newNodeName(table, 'NewName')).toEqual('NewName');
      table.getRowModel().rows[1].subRows[1].subRows[0].subRows[0].original.name = 'NewName';
      expect(newNodeName(table, 'NewName')).toEqual('NewName2');
    });
  });

  describe('keyOfFirstSelectedNonLeafRow', () => {
    test('noSelection', () => {
      table.getState().rowSelection = {};
      expect(keyOfFirstSelectedNonLeafRow(table)).toEqual('');
    });

    test('folderSelection', () => {
      table.getState().rowSelection = { '1.1': true };
      expect(keyOfFirstSelectedNonLeafRow(table)).toEqual('NameNode1.NameNode11');
    });

    test('rootLeafSelection', () => {
      table.getState().rowSelection = { '0': true };
      expect(keyOfFirstSelectedNonLeafRow(table)).toEqual('');
    });

    test('leafSelection', () => {
      table.getState().rowSelection = { '1.1.0.0': true };
      expect(keyOfFirstSelectedNonLeafRow(table)).toEqual('NameNode1.NameNode11.NameNode110');
    });
  });

  test('keysOfAllNonLeafRows', () => {
    expect(keysOfAllNonLeafRows(table)).toEqual([
      'NameNode1',
      'NameNode1.NameNode11',
      'NameNode1.NameNode11.NameNode110',
      'SearchForParentName'
    ]);
  });

  describe('subRowNamesOfRow', () => {
    test('root', () => {
      expect(subRowNamesOfRow('', table)).toEqual(['NameNode0', 'NameNode1', 'SearchForParentName']);
    });

    test('singlePart', () => {
      expect(subRowNamesOfRow('NameNode1', table)).toEqual(['NameNode10', 'NameNode11']);
    });

    test('multipleParts', () => {
      expect(subRowNamesOfRow('NameNode1.NameNode11.NameNode110', table)).toEqual(['NameNode1100']);
    });

    test('notPresent', () => {
      expect(subRowNamesOfRow('This.Key.Is.Not.Present', table)).toEqual([]);
    });
  });
});
