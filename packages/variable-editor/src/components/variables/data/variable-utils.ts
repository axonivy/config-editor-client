import { IvyIcons } from '@axonivy/ui-icons';
import type { KnownVariables } from '@axonivy/variable-editor-protocol';
import { Pair, Scalar, YAMLMap, isMap, isPair, isScalar, parseDocument, stringify } from 'yaml';
import { addSingleLeadingWhitespaceToEachLine, getLastLine, removeSingleLeadingWhitespaceFromEachLine } from '../../../utils/string/string';
import { hasChildren } from '../../../utils/tree/tree-data';
import {
  isEnumMetadata,
  isFileMetadata,
  isFileMetadataFilenameExtension,
  isMetadataType,
  type EnumMetadata,
  type FileMetadata,
  type Metadata,
  type MetadataType
} from './metadata';
import type { RootVariable, Variable } from './variable';

export const toVariables = (content: string) => {
  const rootVariable: RootVariable = {
    name: 'Variables',
    value: '',
    description: '',
    commentAfter: '',
    metadata: { type: '' },
    children: []
  };

  const document = parseDocument(content);
  const documentComment = document.commentBefore;
  if (documentComment) {
    rootVariable.description = documentComment;
  }

  const contents = document.contents;
  if (!isMap<Scalar, Pair>(contents)) {
    return rootVariable;
  }
  const topLevelNodes = contents.items;
  if (topLevelNodes.length !== 1) {
    return rootVariable;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const variablesNode = topLevelNodes[0]!;
  if (variablesNode.key.value != 'Variables') {
    return rootVariable;
  }

  const variablesDescription = variablesNode.key.commentBefore;
  if (variablesDescription) {
    rootVariable.description = variablesDescription;
  }
  const commentAfter = document.comment;
  if (commentAfter) {
    rootVariable.commentAfter = commentAfter;
  }

  const variablesNodeValue = variablesNode.value;
  if (!isMap<Scalar, Pair>(variablesNodeValue)) {
    return rootVariable;
  }
  const variables = variablesNodeValue.items;
  const variable = variables[0];
  if (variable === undefined) {
    return rootVariable;
  }

  const firstVariableKey = variable.key;
  if (isScalar(firstVariableKey)) {
    firstVariableKey.commentBefore = variablesNodeValue.commentBefore;
  }

  rootVariable.children = parseNodes(variables);
  return rootVariable;
};

const parseNodes = (nodes: Array<Pair>): Array<Variable> => {
  if (!nodes || nodes.length === 0) {
    return [];
  }
  return nodes.map(parseNode);
};

const parseNode = (node: Pair) => {
  const variable: Variable = {
    name: '',
    value: '',
    description: '',
    metadata: { type: '' },
    children: []
  };

  const key = node.key;
  if (isScalar<string>(key)) {
    variable.name = key.value;
  }

  const nodeValue = node.value;
  if (isPair<Scalar, YAMLMap>(node) && isMap(nodeValue)) {
    return enrichVariableWithChildren(variable, node);
  } else if (isPair<Scalar, Scalar>(node) && isScalar(nodeValue)) {
    return enrichVariableWithoutChildren(variable, node);
  }
  return variable;
};

const enrichVariableWithChildren = (variable: Variable, node: Pair<Scalar, YAMLMap>) => {
  const commentBefore = node.key.commentBefore;
  if (commentBefore) {
    variable.description = removeSingleLeadingWhitespaceFromEachLine(commentBefore);
  }
  const nodeValue = node.value;
  if (isMap<Scalar, Pair>(nodeValue)) {
    const nodeValueItems = nodeValue.items;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    nodeValueItems[0]!.key.commentBefore = nodeValue.commentBefore;
    variable.children = parseNodes(nodeValueItems);
  }
  return variable;
};

const enrichVariableWithoutChildren = (variable: Variable, node: Pair<Scalar, Scalar>) => {
  const nodeValue = node.value;
  if (nodeValue) {
    const nodeValueValue = nodeValue.value;
    if (nodeValueValue !== null) {
      variable.value = String(nodeValueValue);
    }
  }
  return enrichVariableDescriptionAndMetadata(variable, node);
};

const enrichVariableDescriptionAndMetadata = (variable: Variable, node: Pair<Scalar, Scalar>) => {
  const commentBefore = node.key.commentBefore;
  if (!commentBefore) {
    return variable;
  }
  variable.description = removeSingleLeadingWhitespaceFromEachLine(commentBefore);
  return enrichVariableMetadata(variable);
};

const enrichVariableMetadata = (variable: Variable) => {
  const metadata = extractMetadata(variable);
  if (!metadata) {
    return variable;
  }

  if (isMetadataType(metadata)) {
    return enrichVariableWithMetadata(variable, metadata);
  }
  if (metadata.startsWith('enum:')) {
    return enrichVariableWithEnumMetadata(variable, metadata);
  }
  if (metadata.startsWith('file:')) {
    return enrichVariableWithFileMetadata(variable, metadata);
  }
  return variable;
};

const extractMetadata = (variable: Variable) => {
  const lastDescriptionLine = getLastLine(variable.description);
  if (!lastDescriptionLine) {
    return;
  }
  const metadataMatch = lastDescriptionLine.match(/^\s*\[(.+)\]\s*$/);
  if (!metadataMatch || metadataMatch.length !== 2) {
    return;
  }
  variable.description = variable.description.substring(0, variable.description.lastIndexOf('\n'));
  return metadataMatch[1];
};

const enrichVariableWithMetadata = (variable: Variable, metadataType: MetadataType) => {
  variable.metadata = { type: metadataType };
  return variable;
};

const enrichVariableWithEnumMetadata = (variable: Variable, metadata: string) => {
  const enumValues = metadata
    .replace(/^enum:/, '')
    .replace(/\s/g, '')
    .split(',');
  const enumMetadata: EnumMetadata = { type: 'enum', values: enumValues };
  variable.metadata = enumMetadata;
  return variable;
};

const enrichVariableWithFileMetadata = (variable: Variable, metadata: string) => {
  const filenameExtension = metadata.replace(/^file:\s*/, '');
  if (isFileMetadataFilenameExtension(filenameExtension)) {
    const fileMetadata: FileMetadata = { type: 'file', extension: filenameExtension };
    variable.metadata = fileMetadata;
  }
  return variable;
};

export const toContent = (rootVariable: RootVariable) => {
  const variables = new YAMLMap();
  variables.add(new Pair(new Scalar('Variables'), parseVariables(rootVariable.children)));
  variables.commentBefore = rootVariable.description;
  variables.comment = rootVariable.commentAfter;
  return stringify(variables);
};

const parseVariables = (variables: Array<Variable>) => {
  const map = new YAMLMap();
  variables.forEach(variable => {
    if (!map.has(variable.name)) {
      map.add(parseVariable(variable));
    }
  });
  return map;
};

const parseVariable = (variable: Variable) => {
  const variableKey = new Scalar(variable.name);
  variableKey.commentBefore = parseKeyDescription(variable);
  let variableValue;
  if (variable.children.length === 0) {
    variableValue = new Scalar(variable.value);
  } else {
    variableValue = parseVariables(variable.children);
  }
  return new Pair(variableKey, variableValue);
};

const parseKeyDescription = (variable: Variable) => {
  const metadata = variable.metadata;
  const description = variable.description;
  if (metadata.type === '') {
    if (description) {
      return addSingleLeadingWhitespaceToEachLine(description);
    }
    return undefined;
  }

  const metadataComment = parseMetadataComment(metadata);
  const commentBefore = description ? description + '\n' + metadataComment : metadataComment;
  return addSingleLeadingWhitespaceToEachLine(commentBefore);
};

const parseMetadataComment = (metadata: Metadata) => {
  let metadataComment;
  switch (metadata.type) {
    case 'enum':
      if (isEnumMetadata(metadata)) {
        metadataComment = 'enum: ' + metadata.values.join(', ');
      }
      break;
    case 'file':
      if (isFileMetadata(metadata)) {
        metadataComment = 'file: ' + metadata.extension;
      }
      break;
    default:
      metadataComment = metadata.type;
      break;
  }
  return '[' + metadataComment + ']';
};

export const variableIcon = (variable: Variable) => {
  if (hasChildren(variable)) {
    return IvyIcons.FolderOpen;
  }
  return icon(variable.metadata.type);
};

export const nodeIcon = (node: KnownVariables) => {
  return icon(node.metaData.type);
};

const icon = (type: string) => {
  switch (type) {
    case 'folder':
      return IvyIcons.FolderOpen;
    case 'password':
      return IvyIcons.Password;
    case 'daytime':
      return IvyIcons.CalendarTime;
    case 'enum':
      return IvyIcons.List;
    case 'file':
      return IvyIcons.Note;
    default:
      return IvyIcons.Quote;
  }
};
