import { Fieldset, Input, SimpleSelect, Textarea, ToolbarTitle } from '@axonivy/ui-components';
import { Metadata, type Variable } from '../../data/Variable';

type VariableProps = {
  variable: Variable;
};

export const VariableDetail = ({ variable }: VariableProps) => {
  const metadataOptions = Object.keys(Metadata)
    .filter(key => isNaN(Number(key)))
    .map(key => {
      const option = key.toString();
      return { value: option, label: option };
    });
  metadataOptions.unshift({ value: 'None', label: 'None' });
  const selectedMetadataOption = variable.metadata === undefined ? 'None' : Metadata[variable.metadata];

  return (
    <>
      <ToolbarTitle>Variable Configuration</ToolbarTitle>
      <Fieldset label='Name'>
        <Input value={variable.name} />
      </Fieldset>
      {variable.children.length == 0 && (
        <>
          <Fieldset label='Value'>
            <Input value={variable.value} />
          </Fieldset>
          <Fieldset label='Description'>
            <Textarea value={variable.description} />
          </Fieldset>
          <Fieldset label='Metadata'>
            <SimpleSelect defaultValue={selectedMetadataOption} items={metadataOptions}></SimpleSelect>
          </Fieldset>
        </>
      )}
    </>
  );
};
