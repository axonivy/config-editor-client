import { setupData } from './test-utils/setup';
import { TestTreeNodeFactory } from './test-utils/types';
import { addNode, getNode, getNodesOnPath, hasChildren, removeNode, updateNode } from './tree-data';
import { type TreeNodeUpdates } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeUpdates: TreeNodeUpdates<{ name: string; value: string; children: Array<any> }> = [
  { key: 'name', value: 'newName' },
  { key: 'value', value: 'newValue' }
];

describe('getNode', () => {
  describe('present', () => {
    test('root', () => {
      const data = setupData();
      expect(getNode(data, [0])).toEqual(data[0]);
    });

    test('deep', () => {
      const data = setupData();
      expect(getNode(data, [1, 1, 0])).toEqual(data[1]?.children[1]?.children[0]);
    });
  });

  describe('missing', () => {
    test('root', () => {
      const data = setupData();
      expect(getNode(data, [42])).toBeUndefined();
    });

    test('deep', () => {
      const data = setupData();
      expect(getNode(data, [1, 1, 42])).toBeUndefined();
    });
  });

  describe('pathNotProvided', () => {
    test('undefined', () => {
      const data = setupData();
      expect(getNode(data, undefined)).toBeUndefined();
    });

    test('empty', () => {
      const data = setupData();
      expect(getNode(data, [])).toBeUndefined();
    });
  });
});

describe('getNodesOnPath', () => {
  test('default', () => {
    const data = setupData();
    const nodesOnPath = getNodesOnPath(data, [1, 1, 0]);
    expect(nodesOnPath).toHaveLength(3);
    expect(nodesOnPath[0]).toEqual(data[1]);
    expect(nodesOnPath[1]).toEqual(data[1]?.children[1]);
    expect(nodesOnPath[2]).toEqual(data[1]?.children[1]?.children[0]);
  });

  test('missing', () => {
    const data = setupData();
    const nodesOnPath = getNodesOnPath(data, [1, 42, 42]);
    expect(nodesOnPath).toHaveLength(2);
    expect(nodesOnPath[0]).toEqual(data[1]);
    expect(nodesOnPath[1]).toBeUndefined();
  });

  describe('pathNotProvided', () => {
    test('undefined', () => {
      const data = setupData();
      expect(getNodesOnPath(data, undefined)).toEqual([]);
    });

    test('empty', () => {
      const data = setupData();
      expect(getNodesOnPath(data, [])).toEqual([]);
    });
  });
});

describe('updateNode', () => {
  test('present', () => {
    const data = setupData();
    const originalData = structuredClone(data);
    const newData = updateNode(data, [1, 0], nodeUpdates);
    expect(data).toEqual(originalData);
    expect(newData).not.toBe(data);
    expect(newData[1]?.children[0]?.name).toEqual('newName');
    expect(newData[1]?.children[0]?.value).toEqual('newValue');
  });

  test('missing', () => {
    const data = setupData();
    const originalData = structuredClone(data);
    const newData = updateNode(data, [42], nodeUpdates);
    expect(data).toEqual(originalData);
    expect(newData).not.toBe(data);
    expect(newData).toEqual(data);
  });
});

describe('addNode', () => {
  test('addToRoot', () => {
    const data = setupData();
    const originalData = structuredClone(data);
    const addNodeReturnValue = addNode('NewNode', '', data, TestTreeNodeFactory);
    const newData = addNodeReturnValue.newData;
    const newNodePath = addNodeReturnValue.newNodePath;
    expect(data).toEqual(originalData);
    expect(newData).not.toBe(data);
    expect(newNodePath).toEqual([2]);
    expect(newData).toHaveLength(3);
    expect(newData[2]?.name).toEqual('NewNode');
  });

  test('addToExisting', () => {
    const data = setupData();
    const originalData = structuredClone(data);
    const addNodeReturnValue = addNode('NewNode', 'NameNode1.NameNode11', data, TestTreeNodeFactory);
    const newData = addNodeReturnValue.newData;
    const newNodePath = addNodeReturnValue.newNodePath;
    expect(data).toEqual(originalData);
    expect(newData).not.toBe(data);
    expect(newNodePath).toEqual([1, 1, 1]);
    expect(newData[1]?.children[1].children).toHaveLength(2);
    expect(newData[1]?.children[1].children[1].name).toEqual('NewNode');
  });

  test('completelyNew', () => {
    const data = setupData();
    const originalData = structuredClone(data);
    const addNodeReturnValue = addNode('NewNode', 'New.Namespace', data, TestTreeNodeFactory);
    const newData = addNodeReturnValue.newData;
    const newNodePath = addNodeReturnValue.newNodePath;
    expect(data).toEqual(originalData);
    expect(newData).not.toBe(data);
    expect(newNodePath).toEqual([2, 0, 0]);
    expect(newData).toHaveLength(3);
    expect(newData[2]?.name).toEqual('New');
    expect(newData[2]?.children).toHaveLength(1);
    expect(newData[2]?.children[0]?.name).toEqual('Namespace');
    expect(newData[2]?.children[0]?.children).toHaveLength(1);
    expect(newData[2]?.children[0]?.children[0]?.name).toEqual('NewNode');
  });

  test('partiallyNew', () => {
    const data = setupData();
    const originalData = structuredClone(data);
    const addNodeReturnValue = addNode('NewNode', 'NameNode1.NameNode11.New.Namespace', data, TestTreeNodeFactory);
    const newData = addNodeReturnValue.newData;
    const newNodePath = addNodeReturnValue.newNodePath;
    expect(data).toEqual(originalData);
    expect(newData).not.toBe(data);
    expect(newNodePath).toEqual([1, 1, 1, 0, 0]);
    expect(newData[1]?.children[1].children).toHaveLength(2);
    expect(newData[1]?.children[1].children[1].name).toEqual('New');
    expect(newData[1]?.children[1].children[1].children).toHaveLength(1);
    expect(newData[1]?.children[1].children[1].children[0].name).toEqual('Namespace');
    expect(newData[1]?.children[1].children[1].children[0].children).toHaveLength(1);
    expect(newData[1]?.children[1].children[1].children[0].children[0].name).toEqual('NewNode');
  });
});

describe('removeNode', () => {
  describe('present', () => {
    test('root', () => {
      const data = setupData();
      const originalData = structuredClone(data);
      const newData = removeNode(data, [1]);
      expect(data).toEqual(originalData);
      expect(newData).not.toBe(data);
      expect(newData).toHaveLength(1);
      expect(newData[0]).toEqual(data[0]);
    });

    test('deep', () => {
      const data = setupData();
      const originalData = structuredClone(data);
      const newData = removeNode(data, [1, 1, 0]);
      expect(data).toEqual(originalData);
      expect(newData).not.toEqual(data);
      expect(newData[1]?.children[1]?.children).toHaveLength(0);
    });
  });

  test('missing', () => {
    const data = setupData();
    const originalData = structuredClone(data);
    const newData = removeNode(data, [42]);
    expect(data).toEqual(originalData);
    expect(newData).not.toBe(data);
    expect(newData).toEqual(data);
  });
});

describe('hasChildren', () => {
  test('true', () => {
    const data = setupData();
    expect(hasChildren(data[1]!)).toBeTruthy();
  });

  test('false', () => {
    const data = setupData();
    expect(hasChildren(data[0]!)).toBeFalsy();
  });
});
