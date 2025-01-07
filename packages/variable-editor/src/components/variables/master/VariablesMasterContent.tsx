import {
  BasicField,
  Button,
  ExpandableCell,
  ExpandableHeader,
  Flex,
  selectRow,
  Separator,
  Table,
  TableBody,
  TableResizableHeader,
  useReadonly,
  useTableExpand,
  useTableKeyHandler,
  useTableSelect
} from '@axonivy/ui-components';
import { IvyIcons } from '@axonivy/ui-icons';
import { getCoreRowModel, useReactTable, type ColumnDef, type Table as TanstackTable } from '@tanstack/react-table';
import { useAppContext } from '../../../context/AppContext';
import { deleteFirstSelectedRow, useTreeGlobalFilter } from '../../../utils/tree/tree';
import { type Variable } from '../data/variable';
import { variableIcon } from '../data/variable-utils';
import { AddVariableDialog } from '../dialog/AddDialog';
import { OverwriteDialog } from '../dialog/OverwriteDialog';
import { ValidationRow } from './ValidationRow';
import './VariablesMasterContent.css';
import { useEffect } from 'react';

const useUpdateSelection = (table: TanstackTable<Variable>) => {
  const { setSelectedVariable } = useAppContext();
  const selectedRows = table.getSelectedRowModel().flatRows;
  const selectedVariable = selectedRows.length === 1 ? selectedRows[0].id : undefined;
  useEffect(() => {
    if (selectedVariable) {
      setSelectedVariable(selectedVariable.split('.').map(Number));
    }
  }, [selectedRows, selectedVariable, setSelectedVariable]);
};

export const VariablesMasterContent = () => {
  const { variables, setVariables, setSelectedVariable, detail, setDetail } = useAppContext();

  const selection = useTableSelect<Variable>();
  const expanded = useTableExpand<Variable>();
  const globalFilter = useTreeGlobalFilter(variables);
  const columns: Array<ColumnDef<Variable, string>> = [
    {
      accessorKey: 'name',
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
  useUpdateSelection(table);
  const { handleKeyDown } = useTableKeyHandler({
    table,
    data: variables
  });

  const deleteVariable = () =>
    setVariables(old => {
      const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, old);
      setSelectedVariable(deleteFirstSelectedRowReturnValue.selectedPath);
      return deleteFirstSelectedRowReturnValue.newData;
    });

  const resetSelection = () => {
    selectRow(table);
    setSelectedVariable([]);
  };

  const readonly = useReadonly();
  const control = readonly ? null : (
    <Flex gap={2}>
      <AddVariableDialog table={table} />
      <Separator decorative orientation='vertical' style={{ height: '20px', margin: 0 }} />
      <OverwriteDialog table={table} />
      <Separator decorative orientation='vertical' style={{ height: '20px', margin: 0 }} />
      <Button
        icon={IvyIcons.Trash}
        onClick={deleteVariable}
        disabled={table.getSelectedRowModel().flatRows.length === 0}
        aria-label='Delete variable'
      />
    </Flex>
  );

  return (
    <Flex direction='column' className='master-content-container' onClick={resetSelection}>
      <BasicField className='master-content' label='List of variables' control={control} onClick={event => event.stopPropagation()}>
        {globalFilter.filter}
        <Table onKeyDown={e => handleKeyDown(e, () => setDetail(!detail))}>
          <TableResizableHeader headerGroups={table.getHeaderGroups()} onClick={resetSelection} />
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <ValidationRow key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </BasicField>
    </Flex>
  );
};
