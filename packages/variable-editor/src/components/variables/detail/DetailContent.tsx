import { BasicField, BasicInput, Flex, PanelMessage, Textarea } from '@axonivy/ui-components';
import { EMPTY_PROJECT_VAR_NODE } from '@axonivy/variable-editor-protocol';
import { useMemo } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useMeta } from '../../../context/useMeta';
import { getNode, updateNode, hasChildren as variableHasChildren } from '../../../utils/tree/tree-data';
import { type VariableUpdates } from '../data/variable';
import './DetailContent.css';
import { Metadata } from './Metadata';
import { Value } from './Value';

export const VariablesDetailContent = () => {
  const { context, variables, setVariables, selectedVariable } = useAppContext();

  const variable = useMemo(() => getNode(variables, selectedVariable), [variables, selectedVariable]);
  const knownVariables = useMeta('meta/knownVariables', context, EMPTY_PROJECT_VAR_NODE).data;
  if (!variable) {
    return <PanelMessage message='Select a variable to edit its properties.' />;
  }

  const hasChildren = variableHasChildren(variable);

  const handleVariableAttributeChange = (updates: VariableUpdates) => setVariables(old => updateNode(old, selectedVariable, updates));

  return (
    <Flex direction='column' gap={4} className='detail-content'>
      <BasicField label='Name'>
        <BasicInput value={variable.name} onChange={event => handleVariableAttributeChange([{ key: 'name', value: event.target.value }])} />
      </BasicField>
      {!hasChildren && <Value variable={variable} onChange={handleVariableAttributeChange} />}
      <BasicField label='Description'>
        <Textarea
          value={variable.description}
          onChange={event => handleVariableAttributeChange([{ key: 'description', value: event.target.value }])}
        />
      </BasicField>
      {!hasChildren && <Metadata variable={variable} onChange={handleVariableAttributeChange} />}
    </Flex>
  );
};
