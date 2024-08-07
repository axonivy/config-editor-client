import { TestNodeFactory, type TestNode } from './test-utils/types';
import { addNode, getNode, getNodesOnPath, hasChildren, removeNode, updateNode } from './tree-data';
import { treeNodeNameAttribute, treeNodeValueAttribute, type TreeNodeUpdates } from './types';

let data: Array<TestNode>;
let nodeUpdates: TreeNodeUpdates<TestNode>;

beforeEach(() => {
  data = [
    { name: 'NameNode0', value: 'ValueNode0', children: [] },
    {
      name: 'NameNode1',
      value: 'ValueNode1',
      children: [
        { name: 'NameNode10', value: 'ValueNode10', children: [] },
        {
          name: 'NameNode11',
          value: 'ValueNode11',
          children: [
            {
              name: 'NameNode110',
              value: 'ValueNode110',
              children: [{ name: 'NameNode1100', value: 'ValueNode1100', children: [] }]
            }
          ]
        }
      ]
    }
  ];
  nodeUpdates = [
    { key: treeNodeNameAttribute, value: 'newName' },
    { key: treeNodeValueAttribute, value: 'newValue' }
  ];
});

describe('tree-data', () => {
  describe('getNode', () => {
    describe('present', () => {
      test('root', () => {
        expect(getNode(data, [0])).toEqual(data[0]);
      });

      test('deep', () => {
        expect(getNode(data, [1, 1, 0])).toEqual(data[1].children[1].children[0]);
      });
    });

    describe('missing', () => {
      test('root', () => {
        expect(getNode(data, [42])).toBeUndefined();
      });

      test('deep', () => {
        expect(getNode(data, [1, 1, 42])).toBeUndefined();
      });
    });

    describe('pathNotProvided', () => {
      test('undefined', () => {
        expect(getNode(data, undefined)).toBeUndefined();
      });

      test('empty', () => {
        expect(getNode(data, [])).toBeUndefined();
      });
    });
  });

  describe('getNodesOnPath', () => {
    test('default', () => {
      const nodesOnPath = getNodesOnPath(data, [1, 1, 0]);
      expect(nodesOnPath).toHaveLength(3);
      expect(nodesOnPath[0]).toEqual(data[1]);
      expect(nodesOnPath[1]).toEqual(data[1].children[1]);
      expect(nodesOnPath[2]).toEqual(data[1].children[1].children[0]);
    });

    test('missing', () => {
      const nodesOnPath = getNodesOnPath(data, [1, 42, 42]);
      expect(nodesOnPath).toHaveLength(2);
      expect(nodesOnPath[0]).toEqual(data[1]);
      expect(nodesOnPath[1]).toBeUndefined();
    });

    describe('pathNotProvided', () => {
      test('undefined', () => {
        expect(getNodesOnPath(data, undefined)).toEqual([]);
      });

      test('empty', () => {
        expect(getNodesOnPath(data, [])).toEqual([]);
      });
    });
  });

  describe('updateNode', () => {
    test('present', () => {
      const originalData = structuredClone(data);
      const newData = updateNode(data, [1, 0], nodeUpdates);
      expect(data).toEqual(originalData);
      expect(newData).not.toBe(data);
      expect(newData[1].children[0].name).toEqual('newName');
      expect(newData[1].children[0].value).toEqual('newValue');
    });

    test('missing', () => {
      const originalData = structuredClone(data);
      const newData = updateNode(data, [42], nodeUpdates);
      expect(data).toEqual(originalData);
      expect(newData).not.toBe(data);
      expect(newData).toEqual(data);
    });
  });

  describe('addNode', () => {
    test('addToRoot', () => {
      const originalData = structuredClone(data);
      const addNodeReturnValue = addNode('NewNode', '', data, TestNodeFactory);
      const newData = addNodeReturnValue.newData;
      const newNodePath = addNodeReturnValue.newNodePath;
      expect(data).toEqual(originalData);
      expect(newData).not.toBe(data);
      expect(newNodePath).toEqual([2]);
      expect(newData).toHaveLength(3);
      expect(newData[2].name).toEqual('NewNode');
    });

    test('addToExisting', () => {
      const originalData = structuredClone(data);
      const addNodeReturnValue = addNode('NewNode', 'NameNode1.NameNode11', data, TestNodeFactory);
      const newData = addNodeReturnValue.newData;
      const newNodePath = addNodeReturnValue.newNodePath;
      expect(data).toEqual(originalData);
      expect(newData).not.toBe(data);
      expect(newNodePath).toEqual([1, 1, 1]);
      expect(newData[1].children[1].children).toHaveLength(2);
      expect(newData[1].children[1].children[1].name).toEqual('NewNode');
    });

    test('completelyNew', () => {
      const originalData = structuredClone(data);
      const addNodeReturnValue = addNode('NewNode', 'New.Namespace', data, TestNodeFactory);
      const newData = addNodeReturnValue.newData;
      const newNodePath = addNodeReturnValue.newNodePath;
      expect(data).toEqual(originalData);
      expect(newData).not.toBe(data);
      expect(newNodePath).toEqual([2, 0, 0]);
      expect(newData).toHaveLength(3);
      expect(newData[2].name).toEqual('New');
      expect(newData[2].children).toHaveLength(1);
      expect(newData[2].children[0].name).toEqual('Namespace');
      expect(newData[2].children[0].children).toHaveLength(1);
      expect(newData[2].children[0].children[0].name).toEqual('NewNode');
    });

    test('partiallyNew', () => {
      const originalData = structuredClone(data);
      const addNodeReturnValue = addNode('NewNode', 'NameNode1.NameNode11.New.Namespace', data, TestNodeFactory);
      const newData = addNodeReturnValue.newData;
      const newNodePath = addNodeReturnValue.newNodePath;
      expect(data).toEqual(originalData);
      expect(newData).not.toBe(data);
      expect(newNodePath).toEqual([1, 1, 1, 0, 0]);
      expect(newData[1].children[1].children).toHaveLength(2);
      expect(newData[1].children[1].children[1].name).toEqual('New');
      expect(newData[1].children[1].children[1].children).toHaveLength(1);
      expect(newData[1].children[1].children[1].children[0].name).toEqual('Namespace');
      expect(newData[1].children[1].children[1].children[0].children).toHaveLength(1);
      expect(newData[1].children[1].children[1].children[0].children[0].name).toEqual('NewNode');
    });
  });

  describe('removeNode', () => {
    describe('present', () => {
      test('root', () => {
        const originalData = structuredClone(data);
        const newData = removeNode(data, [1]);
        expect(data).toEqual(originalData);
        expect(newData).not.toBe(data);
        expect(newData).toHaveLength(1);
        expect(newData[0]).toEqual(data[0]);
      });

      test('deep', () => {
        const originalData = structuredClone(data);
        const newData = removeNode(data, [1, 1, 0]);
        expect(data).toEqual(originalData);
        expect(newData).not.toBe(data);
        expect(newData[1].children[1].children).toHaveLength(0);
      });
    });

    test('missing', () => {
      const originalData = structuredClone(data);
      const newData = removeNode(data, [42]);
      expect(data).toEqual(originalData);
      expect(newData).not.toBe(data);
      expect(newData).toEqual(data);
    });
  });

  describe('hasChildren', () => {
    test('true', () => {
      expect(hasChildren(data[1])).toBeTruthy();
    });

    test('false', () => {
      expect(hasChildren(data[0])).toBeFalsy();
    });
  });
});
