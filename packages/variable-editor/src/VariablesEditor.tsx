import {
  Button,
  Flex,
  PanelMessage,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SidebarHeader,
  Spinner
} from '@axonivy/ui-components';
import { IvyIcons } from '@axonivy/ui-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { RootVariable, Variable } from './components/variables/data/variable';
import { toContent, toVariables } from './components/variables/data/variable-utils';
import { VariablesDetailContent } from './components/variables/detail/DetailContent';
import { VariablesMasterContent } from './components/variables/master/VariablesMasterContent';
import { VariablesMasterToolbar } from './components/variables/master/VariablesMasterToolbar';
import { AppProvider } from './context/AppContext';
import { useClient } from './protocol/ClientContextProvider';
import type { VariablesData, EditorProps, ValidationMessages, VariablesEditorDataContext } from '@axonivy/variable-editor-protocol';
import { genQueryKey } from './query/query-client';
import type { Unary } from './utils/lambda/lambda';
import { getNode } from './utils/tree/tree-data';
import type { TreePath } from './utils/tree/types';
import './VariablesEditor.css';
import { useAction } from './context/useAction';

function VariableEditor(props: EditorProps) {
  const [detail, setDetail] = useState(true);
  const [context, setContext] = useState(props.context);
  const [directSave, setDirectSave] = useState(props.directSave);
  useEffect(() => {
    setContext(props.context);
    setDirectSave(props.directSave);
  }, [props]);
  const [selectedVariable, setSelectedVariable] = useState<TreePath>([]);

  const client = useClient();
  const queryClient = useQueryClient();

  const queryKeys = useMemo(
    () => ({
      data: (context: VariablesEditorDataContext) => genQueryKey('data', context),
      saveData: (context: VariablesEditorDataContext) => genQueryKey('saveData', context),
      validate: (context: VariablesEditorDataContext) => genQueryKey('validate', context)
    }),
    []
  );

  const { data, isPending, isError, isSuccess, error } = useQuery({
    queryKey: queryKeys.data(context),
    queryFn: async () => {
      const content = await client.data(context);
      return { ...content, root: toVariables(content.data) };
    },
    structuralSharing: false
  });

  const validations = useQuery({
    queryKey: queryKeys.validate(context),
    queryFn: async () => await client.validate(context),
    initialData: [],
    enabled: isSuccess
  }).data;

  const mutation = useMutation({
    mutationKey: queryKeys.saveData(context),
    mutationFn: async (updateData: Unary<Array<Variable>>) => {
      const saveData = queryClient.setQueryData<VariablesData & { root: RootVariable }>(queryKeys.data(context), prevData => {
        if (prevData) {
          prevData.root.children = updateData(prevData.root.children);
          return prevData;
        }
        return;
      });
      if (saveData) {
        return await client.saveData({ context, data: toContent(saveData.root), directSave });
      }
      return Promise.resolve([]);
    },
    onSuccess: (data: ValidationMessages) => queryClient.setQueryData(queryKeys.validate(context), data)
  });

  const openUrl = useAction('openUrl');

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

  const title = `Variables - ${context.pmv}`;
  let detailTitle = title;
  const variable = getNode(data.root.children, selectedVariable);
  if (variable) {
    detailTitle += ' - ' + variable.name;
  }

  return (
    <AppProvider
      value={{
        variables: data.root.children,
        setVariables: mutation.mutate,
        selectedVariable,
        setSelectedVariable,
        validations,
        context,
        detail,
        setDetail
      }}
    >
      <ResizablePanelGroup direction='horizontal' style={{ height: `100vh` }}>
        <ResizablePanel defaultSize={75} minSize={50} className='master-panel' data-testid='master-panel'>
          <Flex className='panel-content-container' direction='column'>
            <VariablesMasterToolbar title={title} />
            <VariablesMasterContent />
          </Flex>
        </ResizablePanel>
        {detail && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={25} minSize={10}>
              <Flex direction='column' className='panel-content-container' data-testid='details-container'>
                <SidebarHeader icon={IvyIcons.PenEdit} title={detailTitle} data-testid='Detail title'>
                  <Button icon={IvyIcons.Help} onClick={() => openUrl(data.helpUrl)} aria-label='Help' />
                </SidebarHeader>
                <VariablesDetailContent />
              </Flex>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </AppProvider>
  );
}

export default VariableEditor;
