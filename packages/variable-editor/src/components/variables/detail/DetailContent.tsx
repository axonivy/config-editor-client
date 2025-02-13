import {
  BasicField,
  BasicInput,
  Flex,
  PanelMessage,
  ReadonlyProvider,
  Textarea,
  useReadonly,
  type MessageData
} from '@axonivy/ui-components';
import { EMPTY_KNOWN_VARIABLES, type ValidationMessages } from '@axonivy/variable-editor-protocol';
import { useMemo } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useMeta } from '../../../context/useMeta';
import { getNodesOnPath, updateNode, hasChildren as variableHasChildren } from '../../../utils/tree/tree-data';
import { type VariableUpdates } from '../data/variable';
import { findVariable } from '../dialog/known-variables';
import './DetailContent.css';
import { Metadata } from './Metadata';
import { Value } from './Value';

export const useOverwrites = (key: Array<string>) => {
  const { context } = useAppContext();
  const knownVariables = useMeta('meta/knownVariables', context, EMPTY_KNOWN_VARIABLES).data;
  if (knownVariables.children.length === 0) {
    return false;
  }
  return findVariable(knownVariables, ...key) !== undefined;
};

export const messageDataOfProperty = (validations: ValidationMessages, property: string): MessageData | undefined => {
  const validationMatches = validations.filter(val => val.property === property);
  if (validationMatches.length === 0) {
    return undefined;
  }

  const validationError = validationMatches.find(val => val.severity === 'ERROR');
  if (validationError) {
    return { message: validationError.message, variant: 'error' };
  }
  const validationWarning = validationMatches.find(val => val.severity === 'WARNING');
  if (validationWarning) {
    return { message: validationWarning.message, variant: 'warning' };
  }
  const validationOther = validationMatches[0];
  return { message: validationOther.message, variant: 'info' };
};

export const VariablesDetailContent = () => {
  const { variables, setVariables, selectedVariable } = useAppContext();
  const readonly = useReadonly();

  const nodesToVariable = useMemo(() => getNodesOnPath(variables, selectedVariable), [variables, selectedVariable]);
  const variable = nodesToVariable.at(-1);

  const key = nodesToVariable.map(node => (node ? node.name : ''));
  const overwrites = useOverwrites(key);

  if (!variable) {
    return <PanelMessage message='Select a variable to edit its properties.' />;
  }

  const hasChildren = variableHasChildren(variable);

  const handleVariableAttributeChange = (updates: VariableUpdates) => setVariables(old => updateNode(old, selectedVariable, updates));

  return (
    <Flex direction='column' gap={4} className='variables-editor-detail-content'>
      <BasicField label='Namespace'>
        <BasicInput value={key.slice(0, -1).join('.')} disabled />
      </BasicField>
      <BasicField label='Name' message={messageDataOfProperty(variable.validations, 'key')}>
        <BasicInput value={variable.name} onChange={event => handleVariableAttributeChange([{ key: 'name', value: event.target.value }])} />
      </BasicField>
      {!hasChildren && (
        <Value
          variable={variable}
          onChange={handleVariableAttributeChange}
          message={messageDataOfProperty(variable.validations, 'value')}
        />
      )}
      <BasicField label='Description'>
        <Textarea
          value={variable.description}
          onChange={event => handleVariableAttributeChange([{ key: 'description', value: event.target.value }])}
        />
      </BasicField>
      {!hasChildren && (
        <ReadonlyProvider readonly={readonly || overwrites}>
          <Metadata variable={variable} onChange={handleVariableAttributeChange} />
        </ReadonlyProvider>
      )}
    </Flex>
  );
};
