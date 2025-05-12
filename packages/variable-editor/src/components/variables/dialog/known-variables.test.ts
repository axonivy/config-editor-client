import { EMPTY_KNOWN_VARIABLES, type KnownVariables, type MetaData } from '@axonivy/variable-editor-protocol';
import type { Variable } from '../data/variable';
import { addKnownVariable, findVariable, toNodes } from './known-variables';

const knownVariables: KnownVariables = {
  namespace: '',
  name: '',
  value: '',
  metaData: { type: 'folder' },
  description: '',
  children: [
    {
      namespace: '',
      name: 'Amazon',
      value: '',
      metaData: { type: 'folder' },
      description: '',
      children: [
        {
          namespace: 'Amazon',
          name: 'Comprehend',
          value: '',
          metaData: { type: 'folder' },
          description: 'Amazon comprehend connector settings',
          children: [
            {
              namespace: 'Amazon.Comprehend',
              name: 'SecretKey',
              value: '<YOUR_SECRET_KEY>',
              metaData: { type: 'password' },
              description: 'Secret key to access amazon comprehend',
              children: []
            },
            {
              namespace: 'Amazon.Comprehend',
              name: 'AccessKey',
              value: '<YOUR_ACCESS_KEY>',
              metaData: { type: 'string' },
              description: 'Access key to access amazon comprehend',
              children: []
            },
            {
              namespace: 'Amazon.Comprehend',
              name: 'Enum',
              value: 'two',
              metaData: { type: 'enum', values: ['one', 'two', 'three'] } as MetaData,
              description: '',
              children: []
            },
            {
              namespace: 'Amazon.Comprehend',
              name: 'File',
              value: '',
              metaData: { type: 'file', extension: 'json' } as MetaData,
              description: '',
              children: []
            }
          ]
        }
      ]
    }
  ]
};

test('toNodes', () => {
  expect(toNodes(EMPTY_KNOWN_VARIABLES)).toEqual([]);

  const nodes = toNodes(knownVariables);
  expect(nodes).toHaveLength(1);
  const root = nodes[0];
  expect(root).toMatchObject({ value: 'Amazon', icon: 'folder-open', info: '' });
  expect(root?.children).toHaveLength(1);
  const node = root?.children[0];
  expect(node).toMatchObject({ value: 'Comprehend', icon: 'folder-open', info: 'Amazon comprehend connector settings' });
  expect(node?.children).toHaveLength(4);
  expect(node?.children[0]).toMatchObject({ value: 'SecretKey', icon: 'password', info: 'Secret key to access amazon comprehend' });
  expect(node?.children[1]).toMatchObject({ value: 'AccessKey', icon: 'quote', info: 'Access key to access amazon comprehend' });
  expect(node?.children[2]).toMatchObject({ value: 'Enum', icon: 'list', info: '' });
  expect(node?.children[3]).toMatchObject({ value: 'File', icon: 'note', info: '' });
});

describe('findVariable', () => {
  test('known variables is empty', () => {
    const knownVariables = { children: [] as Array<KnownVariables> } as KnownVariables;
    expect(findVariable(knownVariables, 'some', 'key')).toBeUndefined();
  });

  test('find folder', () => {
    expect(findVariable(knownVariables, 'Amazon', 'Comprehend')).toEqual({ node: knownVariables?.children[0]?.children[0], path: [0, 0] });
  });

  test('find leaf', () => {
    expect(findVariable(knownVariables, 'Amazon', 'Comprehend', 'AccessKey')).toEqual({
      node: knownVariables?.children[0]?.children[0]?.children[1],
      path: [0, 0, 1]
    });
  });

  test('variable does not exist', () => {
    expect(findVariable(knownVariables, 'notFound')).toBeUndefined();
  });
});

describe('addKnownVariable', () => {
  test('leaf', () => {
    const variables = [{ name: 'Variable' }] as Array<Variable>;
    const originalVariables = structuredClone(variables);
    const addNodeReturnValue = addKnownVariable(variables, knownVariables!.children[0]!.children[0]!.children[0]!);
    const newData = addNodeReturnValue.newData;
    const newNodePath = addNodeReturnValue.newNodePath;
    expect(variables).toEqual(originalVariables);
    expect(newData).not.toBe(variables);
    expect(newNodePath).toEqual([1, 0, 0]);
    expect(newData).toEqual([
      { name: 'Variable' },
      {
        name: 'Amazon',
        value: '',
        description: '',
        metadata: { type: '' },
        children: [
          {
            name: 'Comprehend',
            value: '',
            description: '',
            metadata: { type: '' },
            children: [
              {
                name: 'SecretKey',
                value: '<YOUR_SECRET_KEY>',
                description: 'Secret key to access amazon comprehend',
                metadata: { type: 'password' },
                children: []
              }
            ]
          }
        ]
      }
    ]);
  });

  test('folder', () => {
    const variables = [{ name: 'Variable' }] as Array<Variable>;
    const originalVariables = structuredClone(variables);
    const addNodeReturnValue = addKnownVariable(variables, knownVariables!.children[0]!.children[0]!);
    const newData = addNodeReturnValue.newData;
    const newNodePath = addNodeReturnValue.newNodePath;
    expect(variables).toEqual(originalVariables);
    expect(newData).not.toBe(variables);
    expect(newNodePath).toEqual([1, 0]);
    expect(newData).toEqual([
      { name: 'Variable' },
      {
        name: 'Amazon',
        value: '',
        description: '',
        metadata: { type: '' },
        children: [
          {
            name: 'Comprehend',
            value: '',
            description: 'Amazon comprehend connector settings',
            metadata: { type: '' },
            children: [
              {
                name: 'SecretKey',
                value: '<YOUR_SECRET_KEY>',
                description: 'Secret key to access amazon comprehend',
                metadata: { type: 'password' },
                children: []
              },
              {
                name: 'AccessKey',
                value: '<YOUR_ACCESS_KEY>',
                description: 'Access key to access amazon comprehend',
                metadata: { type: '' },
                children: []
              },
              {
                name: 'Enum',
                value: 'two',
                description: '',
                metadata: { type: 'enum', values: ['one', 'two', 'three'] },
                children: []
              },
              {
                name: 'File',
                value: '',
                description: '',
                metadata: { type: 'file', extension: 'json' },
                children: []
              }
            ]
          }
        ]
      }
    ]);
  });

  test('parent already exists', () => {
    const variables = [
      { name: 'Variable' },
      { name: 'Amazon', children: [{ name: 'Comprehend', children: [] as Array<Variable> }] }
    ] as Array<Variable>;
    const originalVariables = structuredClone(variables);
    const addNodeReturnValue = addKnownVariable(variables, knownVariables!.children[0]!.children[0]!.children[0]!);
    const newData = addNodeReturnValue.newData;
    const newNodePath = addNodeReturnValue.newNodePath;
    expect(variables).toEqual(originalVariables);
    expect(newData).not.toBe(variables);
    expect(newNodePath).toEqual([1, 0, 0]);
    expect(newData).toEqual([
      { name: 'Variable' },
      {
        name: 'Amazon',
        children: [
          {
            name: 'Comprehend',
            children: [
              {
                name: 'SecretKey',
                value: '<YOUR_SECRET_KEY>',
                description: 'Secret key to access amazon comprehend',
                metadata: { type: 'password' },
                children: []
              }
            ]
          }
        ]
      }
    ]);
  });

  test('do not add existing variable', () => {
    const variables = [{ name: 'Amazon', children: [] as Array<Variable> }] as Array<Variable>;
    const originalVariables = structuredClone(variables);
    const addNodeReturnValue = addKnownVariable(variables, knownVariables!.children[0]!);
    const newData = addNodeReturnValue.newData;
    const newNodePath = addNodeReturnValue.newNodePath;
    expect(variables).toEqual(originalVariables);
    expect(newData).not.toBe(variables);
    expect(newNodePath).toEqual([0]);
    expect(newData).toEqual([
      {
        name: 'Amazon',
        children: [
          {
            name: 'Comprehend',
            value: '',
            description: 'Amazon comprehend connector settings',
            metadata: { type: '' },
            children: [
              {
                name: 'SecretKey',
                value: '<YOUR_SECRET_KEY>',
                description: 'Secret key to access amazon comprehend',
                metadata: { type: 'password' },
                children: []
              },
              {
                name: 'AccessKey',
                value: '<YOUR_ACCESS_KEY>',
                description: 'Access key to access amazon comprehend',
                metadata: { type: '' },
                children: []
              },
              {
                name: 'Enum',
                value: 'two',
                description: '',
                metadata: { type: 'enum', values: ['one', 'two', 'three'] },
                children: []
              },
              {
                name: 'File',
                value: '',
                description: '',
                metadata: { type: 'file', extension: 'json' },
                children: []
              }
            ]
          }
        ]
      }
    ]);
  });
});
