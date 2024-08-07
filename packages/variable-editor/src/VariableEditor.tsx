import '@axonivy/ui-icons/lib/ivy-icons.css';
import '@axonivy/ui-components/lib/style.css';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Editor } from './components/editor/Editor';
import type { Variable } from './components/variables/data/variable';
import { toContent, toVariables } from './components/variables/data/variable-utils';
import { VariablesDetail } from './components/variables/detail/VariablesDetail';
import { VariablesMaster } from './components/variables/master/VariablesMaster';
import { useClient } from './protocol/ClientContextProvider';
import type { Data, EditorProps, ValidationMessages } from './protocol/types';
import type { Unary } from './utils/lambda/lambda';
import { getNode } from './utils/tree/tree-data';
import type { TreePath } from './utils/tree/types';
import { genQueryKey } from './query/query-client';
import { Flex, PanelMessage, Spinner } from '@axonivy/ui-components';
import { IvyIcons } from '@axonivy/ui-icons';

function VariableEditor(props: EditorProps) {
  const [context, setContext] = useState(props.context);
  const [directSave, setDirectSave] = useState(props.directSave);
  useEffect(() => {
    setContext(props.context);
    setDirectSave(props.directSave);
  }, [props]);
  const [selectedVariablePath, setSelectedVariablePath] = useState<TreePath>([]);
  const [validationMessages, setValidationMessages] = useState<ValidationMessages>();

  const client = useClient();
  const queryClient = useQueryClient();

  const queryKeys = useMemo(() => {
    return {
      data: () => genQueryKey('data', context),
      saveData: () => genQueryKey('saveData', context),
      validate: () => genQueryKey('validate', context)
    };
  }, [context]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.data(),
    queryFn: () => client.data(context),
    structuralSharing: false
  });

  useQuery({
    queryKey: queryKeys.validate(),
    queryFn: async () => {
      const validationMessages = await client.validate(context);
      setValidationMessages(validationMessages);
      return validationMessages;
    }
  });

  const mutation = useMutation({
    mutationKey: queryKeys.saveData(),
    mutationFn: async (updateData: Unary<string>) => {
      const saveData = queryClient.setQueryData<Data>(queryKeys.data(), prevData => {
        if (prevData) {
          return { ...prevData, data: updateData(prevData.data) };
        }
        return undefined;
      });
      if (saveData) {
        const data = await client.saveData({ context, data: saveData.data, directSave });
        return setValidationMessages(data);
      }
      return Promise.resolve();
    }
  });

  if (isPending) {
    return (
      <Flex alignItems='center' justifyContent='center' style={{ width: '100%', height: '100%' }}>
        <Spinner />
      </Flex>
    );
  }

  if (isError) {
    return <PanelMessage icon={IvyIcons.ErrorXMark} message={`An error has occurred: ${error.message}`} />;
  }

  const rootVariable = toVariables(data.data);
  const setVariables = (variables: Array<Variable>) => {
    const newRootVariable = structuredClone(rootVariable);
    newRootVariable.children = variables;
    mutation.mutate(() => toContent(newRootVariable));
  };

  const title = 'Variables Editor';
  let detailTitle = title;
  const selectedVariable = getNode(rootVariable.children, selectedVariablePath);
  if (selectedVariable) {
    detailTitle += ' - ' + selectedVariable.name;
  }

  return (
    <Editor
      masterTitle={title}
      masterContent={
        <VariablesMaster
          context={context}
          variables={rootVariable.children}
          setVariables={setVariables}
          setSelectedVariablePath={setSelectedVariablePath}
          validationMessages={validationMessages}
        />
      }
      detailTitle={detailTitle}
      detailContent={<VariablesDetail variables={rootVariable.children} variablePath={selectedVariablePath} setVariables={setVariables} />}
    />
  );
}

export default VariableEditor;
