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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useHotkeys,
  useReadonly,
  useTableExpand,
  useTableKeyHandler,
  useTableSelect
} from '@axonivy/ui-components';
import { IvyIcons } from '@axonivy/ui-icons';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useKnownHotkeys } from '../../../utils/hotkeys';
import { deleteFirstSelectedRow, toTreePath, useTreeGlobalFilter } from '../../../utils/tree/tree';
import { type Variable } from '../data/variable';
import { variableIcon } from '../data/variable-utils';
import { AddVariableDialog } from '../dialog/AddDialog';
import { OverwriteDialog } from '../dialog/OverwriteDialog';
import { ValidationRow } from './ValidationRow';
import './VariablesMasterContent.css';

export const ROW_HEIGHT = 36 as const;

export const VariablesMasterContent = () => {
  const { variables, setVariables, setSelectedVariable, detail, setDetail } = useAppContext();

  const selection = useTableSelect<Variable>({
    onSelect: selectedRows => {
      const selectedRowId = Object.keys(selectedRows).find(key => selectedRows[key]);
      const selectedVariable = table.getRowModel().flatRows.find(row => row.id === selectedRowId)?.id;
      setSelectedVariable(toTreePath(selectedVariable));
    }
  });
  const expanded = useTableExpand<Variable>();
  const globalFilter = useTreeGlobalFilter(variables);
  const columns: Array<ColumnDef<Variable, string>> = [
    {
      accessorKey: 'name',
      header: header => <ExpandableHeader name='Name' header={header} />,
      cell: cell => (
        <ExpandableCell cell={cell} icon={variableIcon(cell.row.original)}>
          <span>{cell.getValue()}</span>
        </ExpandableCell>
      ),
      minSize: 200,
      size: 500,
      maxSize: 1000
    },
    {
      accessorFn: (variable: Variable) => (variable.metadata.type === 'password' ? '***' : variable.value),
      header: 'Value',
      cell: cell => <span>{cell.getValue()}</span>,
      minSize: 200,
      size: 500,
      maxSize: 1000
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

  const rows = table.getRowModel().rows;
  const tableContainer = useRef<HTMLDivElement>(null);
  const measureElement = (element: HTMLTableRowElement) => {
    let height = ROW_HEIGHT;
    let nextElement = element.nextElementSibling;
    while (nextElement?.classList.contains('ui-message-row')) {
      height += ROW_HEIGHT;
      nextElement = nextElement.nextElementSibling;
    }
    return height;
  };
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => ROW_HEIGHT,
    measureElement,
    getScrollElement: () => tableContainer.current,
    overscan: 20
  });

  const { handleKeyDown } = useTableKeyHandler({
    table,
    data: variables
  });

  const deleteVariable = () =>
    setVariables(old => {
      const deleteFirstSelectedRowReturnValue = deleteFirstSelectedRow(table, old);
      return deleteFirstSelectedRowReturnValue.newData;
    });

  const resetSelection = () => {
    selectRow(table);
  };

  const readonly = useReadonly();
  const hotkeys = useKnownHotkeys();
  const control = readonly ? null : (
    <Flex gap={2}>
      <AddVariableDialog table={table} />
      <Separator decorative orientation='vertical' style={{ height: '20px', margin: 0 }} />
      <OverwriteDialog table={table} />
      <Separator decorative orientation='vertical' style={{ height: '20px', margin: 0 }} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              icon={IvyIcons.Trash}
              onClick={deleteVariable}
              disabled={table.getSelectedRowModel().flatRows.length === 0}
              aria-label={hotkeys.deleteVar.label}
            />
          </TooltipTrigger>
          <TooltipContent>{hotkeys.deleteVar.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Flex>
  );
  const ref = useHotkeys(hotkeys.deleteVar.hotkey, () => deleteVariable(), { scopes: ['global'], enabled: !readonly });
  const firstElement = useRef<HTMLDivElement>(null);
  useHotkeys(hotkeys.focusMain.hotkey, () => firstElement.current?.focus(), { scopes: ['global'] });

  return (
    <Flex direction='column' ref={ref} className='master-content-container' onClick={resetSelection}>
      <BasicField
        tabIndex={-1}
        ref={firstElement}
        className='master-content'
        label='List of Variables'
        control={control}
        onClick={event => event.stopPropagation()}
      >
        {globalFilter.filter}
        <div ref={tableContainer} className='virtual-table-container'>
          <Table onKeyDown={e => handleKeyDown(e, () => setDetail(!detail))} style={{ display: 'grid' }}>
            <TableResizableHeader headerGroups={table.getHeaderGroups()} onClick={resetSelection} />
            <TableBody style={{ height: `${virtualizer.getTotalSize()}px` }} className='virtual-table-body'>
              {virtualizer.getVirtualItems().map(virtualRow => {
                const row = rows[virtualRow.index];
                return <ValidationRow key={row.id} row={row} virtualRow={virtualRow} virtualizer={virtualizer} />;
              })}
            </TableBody>
          </Table>
        </div>
      </BasicField>
    </Flex>
  );
};
