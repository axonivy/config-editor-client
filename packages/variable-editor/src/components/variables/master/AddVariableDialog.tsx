import {
  Button,
  Combobox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Fieldset,
  Flex,
  Input
} from '@axonivy/ui-components';
import { IvyIcons } from '@axonivy/ui-icons';
import { type Table } from '@tanstack/react-table';
import { useState } from 'react';
import {
  addChildToFirstSelectedRow,
  keyOfFirstSelectedNonLeafRow,
  keysOfAllNonLeafRows,
  subRowsOfFirstSelectedNonLeafRow
} from '../../../utils/tree/tree';
import type { TreePath } from '../../../utils/tree/types';
import type { Variable } from '../data/variable';
import './AddVariableDialog.css';

type AddVariableDialogProps = {
  table: Table<Variable>;
  variables: Array<Variable>;
  setVariables: (variables: Array<Variable>) => void;
  setSelectedVariablePath: (path: TreePath) => void;
};

export const AddVariableDialog = ({ table, variables, setVariables, setSelectedVariablePath }: AddVariableDialogProps) => {
  const [selectedNamespace, setSelectedNamespace] = useState('');

  const onAddVariableDialogOpen = () => {
    setSelectedNamespace(keyOfFirstSelectedNonLeafRow(table));
  };

  const newVariableName = () => {
    const takenNames = subRowsOfFirstSelectedNonLeafRow(table).map(row => row.original.name);
    const baseName = 'NewVariable';
    let newName = baseName;
    let index = 2;
    while (takenNames.includes(newName)) {
      newName = `${baseName}${index}`;
      index++;
    }
    return newName;
  };

  const namespaceOptions = () => {
    return keysOfAllNonLeafRows(table).map(key => ({
      value: key
    }));
  };

  const addVariable = () => {
    const newVariable: Variable = {
      name: '',
      value: '',
      description: '',
      metadata: { type: '' },
      children: []
    };

    const addChildToFirstSelectedRowReturnValue = addChildToFirstSelectedRow(table, variables, newVariable);
    const parentNode = addChildToFirstSelectedRowReturnValue.selectedNode;
    if (parentNode) {
      parentNode.value = '';
      parentNode.metadata = { type: '' };
    }

    setSelectedVariablePath(addChildToFirstSelectedRowReturnValue.newChildPath);
    setVariables(addChildToFirstSelectedRowReturnValue.newData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className='add-variable-dialog-trigger-button'
          icon={IvyIcons.Plus}
          onClick={onAddVariableDialogOpen}
          aria-label='Add variable'
        />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Variable</DialogTitle>
        </DialogHeader>
        <Flex direction='column' gap={2}>
          <Fieldset label='Name'>
            <Input defaultValue={newVariableName()} />
          </Fieldset>
          <Fieldset label='Namespace'>
            <Combobox value={selectedNamespace} onChange={setSelectedNamespace} options={namespaceOptions()} />
          </Fieldset>
        </Flex>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='primary' size='large' type='submit' aria-label='Create variable' onClick={addVariable}>
              Create Variable
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
