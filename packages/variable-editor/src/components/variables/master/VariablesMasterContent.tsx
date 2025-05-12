import {
  BasicField,
  Button,
  ExpandableCell,
  ExpandableHeader,
  Flex,
  groupBy,
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
import type { ValidationMessages } from '@axonivy/variable-editor-protocol';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useKnownHotkeys } from '../../../utils/useKnownHotkeys';
import { deleteFirstSelectedRow, toTreePath, useTreeGlobalFilter } from '../../../utils/tree/tree';
import { type Variable } from '../data/variable';
import { variableIcon } from '../data/variable-utils';
import { AddVariableDialog } from '../dialog/AddDialog';
import { OverwriteDialog } from '../dialog/OverwriteDialog';
import { ValidationRow } from './ValidationRow';
import './VariablesMasterContent.css';
import { useTranslation } from 'react-i18next';

export const ROW_HEIGHT = 36 as const;

export const VariablesMasterContent = () => {
  const { t } = useTranslation();
  const { variables: originalVariables, setVariables, setSelectedVariable, detail, setDetail, validations } = useAppContext();
  const variables = useMemo(() => variablesWithValidations(originalVariables, validations), [originalVariables, validations]);

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
      header: header => <ExpandableHeader name={t('common.label.name')} header={header} />,
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
      header: t('common.label.value'),
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
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: index => rowHeight(rows[index]?.original.validations),
    getScrollElement: () => tableContainer.current,
    overscan: 20
  });
  useEffect(() => virtualizer.measure(), [virtualizer, validations]);

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
    <Flex direction='column' ref={ref} className='variables-editor-main-content' onClick={resetSelection}>
      <BasicField
        tabIndex={-1}
        ref={firstElement}
        className='variables-editor-table-field'
        label={t('label.variables')}
        control={control}
        onClick={event => event.stopPropagation()}
      >
        {globalFilter.filter}
        <div ref={tableContainer} className='variables-editor-table-container'>
          <Table onKeyDown={e => handleKeyDown(e, () => setDetail(!detail))} className='variables-editor-table'>
            <TableResizableHeader headerGroups={table.getHeaderGroups()} onClick={resetSelection} />
            <TableBody style={{ height: `${virtualizer.getTotalSize()}px` }} className='variables-editor-table-body'>
              {virtualizer.getVirtualItems().map(virtualRow => {
                const row = rows[virtualRow.index];
                if (row === undefined) return null;
                return <ValidationRow key={row.id} row={row} virtualRow={virtualRow} />;
              })}
            </TableBody>
          </Table>
        </div>
      </BasicField>
    </Flex>
  );
};

export const variablesWithValidations = (originalVariables: Array<Variable>, validations: ValidationMessages) => {
  if (validations.length === 0) {
    return originalVariables;
  }
  const variables = structuredClone(originalVariables);
  const groupedValidations = groupBy(validations, val => val.path);
  variables.forEach(variable => {
    const key = variable.name;
    variable.validations = groupedValidations[key] ?? [];
    addValidations(variable.children, groupedValidations, key);
  });
  return variables;
};

const addValidations = (variables: Array<Variable>, groupedValidations: Record<string, ValidationMessages>, currentKey: string) => {
  variables.forEach(variable => {
    const key = currentKey + '.' + variable.name;
    variable.validations = groupedValidations[key] ?? [];
    addValidations(variable.children, groupedValidations, key);
  });
};

export const rowHeight = (validations?: ValidationMessages) => {
  const height = 36;
  if (!validations) {
    return height;
  }
  return height * (validations.length + 1);
};
