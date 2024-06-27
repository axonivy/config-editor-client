import {
  Button,
  ExpandableCell,
  ExpandableHeader,
  Fieldset,
  Table,
  TableBody,
  TableResizableHeader,
  useReadonly,
  useTableExpand,
  useTableSelect
} from '@axonivy/ui-components';
import { IvyIcons } from '@axonivy/ui-icons';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import type { ValidationMessages } from '../../../protocol/types';
import { isRowSelected, selectRow } from '../../../utils/table/table';
import { addChildToFirstSelectedRow, deleteFirstSelectedRow, useTreeGlobalFilter } from '../../../utils/tree/tree';
import { treeNodeNameAttribute, type TreePath } from '../../../utils/tree/types';
import { Control } from '../../control/Control';
import { validationMessagesOfRow } from '../data/validation-utils';
import { type Variable } from '../data/variable';
import { variableIcon } from '../data/variable-utils';
import { ValidationRow } from './ValidationRow';
import './VariablesMaster.css';
import { OverwriteDialog } from './OverwriteDialog';

type VariablesProps = {
  variables: Array<Variable>;
  setVariables: (variables: Array<Variable>) => void;
  setSelectedVariablePath: (path: TreePath) => void;
  validationMessages?: ValidationMessages;
};

export const VariablesMaster = ({ variables, setVariables, setSelectedVariablePath, validationMessages }: VariablesProps) => {
  const selection = useTableSelect<Variable>();
  const expanded = useTableExpand<Variable>();
  const globalFilter = useTreeGlobalFilter(variables);
  const columns: Array<ColumnDef<Variable, string>> = [
    {
      accessorKey: treeNodeNameAttribute,
      header: header => <ExpandableHeader name='Name' header={header} />,
      cell: cell => <ExpandableCell cell={cell} icon={variableIcon(cell.row.original)} />,
      minSize: 50
    },
    {
      accessorFn: (variable: Variable) => (variable.metadata.type === 'password' ? '***' : variable.value),
      header: 'Value',
      cell: cell => <div>{cell.getValue()}</div>
    }
  ];
  const table = useReactTable({
    ...selection.options,
    ...expanded.options,
    ...globalFilter.options,
    data: variables,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      ...selection.tableState,
      ...expanded.tableState,
      ...globalFilter.tableState
    }
  });

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

  const deleteVariable = () => {
    const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, variables);
    setSelectedVariablePath(deleteFirstSelectedRowReturnValue.selectedVariablePath);
    setVariables(deleteFirstSelectedRowReturnValue.newData);
  };

  const resetSelection = () => {
    selectRow(table);
    setSelectedVariablePath([]);
  };

  const readonly = useReadonly();
  const controls = [];
  if (!readonly) {
    controls.push(
      <Button key='addButton' icon={IvyIcons.Plus} onClick={addVariable} aria-label='Add variable' />,
      <OverwriteDialog />,
      <Button
        key='deleteButton'
        icon={IvyIcons.Trash}
        onClick={deleteVariable}
        disabled={!table.getIsSomeRowsSelected() && !isRowSelected(table)}
        aria-label='Delete variable'
      />
    );
  }

  return (
    <>
      <Fieldset className='variable-wrapper' label='List of variables' control={<Control buttons={controls} />}>
        {globalFilter.filter}
        <Table>
          <TableResizableHeader headerGroups={table.getHeaderGroups()} onClick={resetSelection} />
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <ValidationRow
                key={row.id}
                row={row}
                setSelectedVariablePath={setSelectedVariablePath}
                validationMessages={validationMessagesOfRow(row, validationMessages)}
              />
            ))}
          </TableBody>
        </Table>
      </Fieldset>
    </>
  );
};
