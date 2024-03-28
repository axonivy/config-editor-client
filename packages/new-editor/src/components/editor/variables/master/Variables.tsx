import {
  ExpandableCell,
  ExpandableHeader,
  Table,
  TableBody,
  TableCell,
  TableResizableHeader,
  TableRow,
  useTableExpand
} from '@axonivy/ui-components';
import { IvyIcons } from '@axonivy/ui-icons';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import type { Variable } from '../../data/Variable';

type VariablesProps = {
  variables: Array<Variable>;
};

export const Variables = ({ variables }: VariablesProps) => {
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
    ...expanded.options,
    data: variables,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      ...expanded.tableState
    }
  });

  return (
    <Table>
      <TableResizableHeader headerGroups={table.getHeaderGroups()} />
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
