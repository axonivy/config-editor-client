import './ValidationRow.css';
import { SelectRow, TableCell } from '@axonivy/ui-components';
import { flexRender, type Row } from '@tanstack/react-table';
import type { ValidationMessages } from '../../../protocol/types';
import { getPathOfRow } from '../../../utils/tree/tree';
import { type TreePath } from '../../../utils/tree/types';
import { containsError, containsWarning } from '../data/validation-utils';
import type { Variable } from '../data/variable';
import { ValidationMessagesRows } from './ValidationMessagesRows';

type ValidationRowProps = {
  row: Row<Variable>;
  setSelectedVariablePath: (path: TreePath) => void;
  validationMessages: ValidationMessages;
};

export const ValidationRow = ({ row, setSelectedVariablePath, validationMessages }: ValidationRowProps) => {
  const rowClass = (validationMessages: ValidationMessages) => {
    if (containsError(validationMessages)) {
      return 'row-error';
    }
    if (containsWarning(validationMessages)) {
      return 'row-warning';
    }
    return '';
  };

  return (
    <>
      <SelectRow row={row} onClick={() => setSelectedVariablePath(getPathOfRow(row))} className={rowClass(validationMessages)}>
        {row.getVisibleCells().map(cell => (
          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
        ))}
      </SelectRow>
      <ValidationMessagesRows validationMessages={validationMessages} />
    </>
  );
};
