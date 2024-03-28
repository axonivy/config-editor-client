import {
  ExpandableCell,
  ExpandableHeader,
  SelectRow,
  Table,
  TableBody,
  TableCell,
  TableResizableHeader,
  useTableExpand,
  useTableSelect
} from '@axonivy/ui-components';
import { IvyIcons } from '@axonivy/ui-icons';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import type { Variable } from '../../data/Variable';

type VariablesProps = {
  variables: Array<Variable>;
  onSelection: any;
};

export const Variables = ({ variables, onSelection }: VariablesProps) => {
  const selection = useTableSelect<Variable>();
  const expanded = useTableExpand<Variable>();
  const columns: ColumnDef<Variable, string>[] = [
    {
      accessorKey: 'name',
      header: header => <ExpandableHeader name='Name' header={header} />,
      cell: cell => <ExpandableCell cell={cell} icon={cell.row.getCanExpand() ? IvyIcons.FolderOpen : IvyIcons.Note} />,
      minSize: 50
    },
    {
      accessorKey: 'value',
      header: () => <span>Value</span>,
      cell: cell => <div>{cell.getValue()}</div>
    }
  ];
  const table = useReactTable({
    ...selection.options,
    ...expanded.options,
    data: variables,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      ...selection.tableState,
      ...expanded.tableState
    }
  });

  return (
    <Table>
      <TableResizableHeader
        headerGroups={table.getHeaderGroups()}
        onClick={() => {
          selection.options.onRowSelectionChange({});
          onSelection();
        }}
      />
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <SelectRow key={row.id} row={row} onClick={() => onSelection(row.original)}>
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </SelectRow>
        ))}
      </TableBody>
    </Table>
  );
};
