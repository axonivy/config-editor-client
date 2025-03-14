import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { Button } from './Button';
import { Message } from './Message';

const ROW_LOCATOR = 'tbody tr:not(.ui-message-row)';
const ROW_SELECTION_ATTR = 'data-state';
const ROW_SELECTED = 'selected';

export class Table {
  readonly locator: Locator;
  private readonly rows: Locator;
  readonly messages: Locator;

  constructor(
    readonly page: Page,
    parentLocator: Locator,
    readonly columns: ColumnType[],
    readonly options?: { virtualized?: boolean }
  ) {
    this.locator = parentLocator.locator('table');
    this.rows = this.locator.locator(ROW_LOCATOR);
    this.messages = this.locator.locator('tbody tr.ui-message-row');
  }

  row(index: number) {
    return new Row(this.page, this.locator, index, this.columns, this.options?.virtualized);
  }

  cell(row: number, column: number) {
    return this.row(row).column(column);
  }

  async expectEmpty() {
    await this.expectRowCount(0);
  }

  async expectNotEmpty() {
    await expect(this.rows).not.toHaveCount(0);
  }

  async expectRowCount(rows: number) {
    await expect(this.rows).toHaveCount(rows);
  }

  async expectToBeSelected(...indexes: Array<number>) {
    for (let i = 0; i < indexes.length; i++) {
      await this.row(indexes[i]).expectSelected();
    }
  }
  async expectToHaveNothingSelected() {
    await expect(this.locator.locator(`${ROW_LOCATOR}[${ROW_SELECTION_ATTR}="${ROW_SELECTED}"]`)).toHaveCount(0);
  }

  async rowCount() {
    return await this.rows.count();
  }

  message(nth: number) {
    return new Message(this.messages.nth(nth));
  }
}

export type ColumnType = 'label' | 'text';

export class Row {
  public readonly locator: Locator;

  constructor(
    readonly page: Page,
    readonly parentLocator: Locator,
    readonly index: number,
    readonly columns: ColumnType[],
    virtualized?: boolean
  ) {
    if (virtualized) {
      this.locator = this.parentLocator.locator(`${ROW_LOCATOR}[data-vindex="${index}"]`);
    } else {
      this.locator = this.parentLocator.locator(ROW_LOCATOR).nth(index);
    }
  }

  async fill(values: string[]) {
    let value = 0;
    for (let column = 0; column < this.columns.length; column++) {
      if (this.columns[column] !== 'label') {
        const cell = this.column(column);
        await cell.fill(values[value++]);
      }
    }
  }

  column(column: number) {
    return new Cell(this.page, this.locator, column, this.columns[column]);
  }

  async expectValues(values: string[]) {
    let value = 0;
    for (let column = 0; column < this.columns.length; column++) {
      const cell = this.column(column);
      await cell.expectValue(values[value++]);
    }
  }

  async click() {
    await this.locator.click();
  }

  async collapse() {
    await this.click();
    await this.column(0).collapse();
  }

  async expand() {
    await this.click();
    await this.column(0).expand();
  }

  async expectSelected() {
    await expect(this.locator).toHaveAttribute(ROW_SELECTION_ATTR, ROW_SELECTED);
  }

  async expectNotSelected() {
    await expect(this.locator).not.toHaveAttribute(ROW_SELECTION_ATTR, ROW_SELECTED);
  }

  async expectCollapsed() {
    await this.column(0).expectCollapsed();
  }

  async expectExpanded() {
    await this.column(0).expectExpanded();
  }

  async expectToHaveNoValidation() {
    await expect(this.locator).not.toHaveClass(/variables-editor-row-error/);
    await expect(this.locator).not.toHaveClass(/variables-editor-row-warning/);
  }

  async expectToHaveError() {
    await expect(this.locator).toHaveClass(/variables-editor-row-error/);
  }

  async expectToHaveWarning() {
    await expect(this.locator).toHaveClass(/variables-editor-row-warning/);
  }
}

export class Cell {
  private readonly locator: Locator;
  private readonly textbox: Locator;
  private readonly collapseBtn: Button;
  private readonly expandBtn: Button;

  constructor(
    readonly page: Page,
    rowLocator: Locator,
    column: number,
    readonly columnType: ColumnType
  ) {
    this.locator = rowLocator.getByRole('cell').nth(column);
    this.textbox = this.locator.getByRole('textbox');
    this.collapseBtn = new Button(this.locator, { name: 'Collapse row' });
    this.expandBtn = new Button(this.locator, { name: 'Expand row' });
  }

  async fill(value: string) {
    switch (this.columnType) {
      case 'label':
        throw new Error('This column is not editable');
      case 'text':
        await this.fillText(value);
        break;
    }
  }

  async value() {
    return await this.textbox.inputValue();
  }

  async expectValue(value: string) {
    switch (this.columnType) {
      case 'label':
        await expect(this.locator).toHaveText(value);
        break;
      default:
        await expect(this.textbox).toHaveValue(value);
    }
  }

  async expectEmpty() {
    await expect(this.textbox).toBeEmpty();
  }

  async expectExpanded() {
    await this.collapseBtn.expectDataState('expanded');
  }

  async expectCollapsed() {
    await this.expandBtn.expectDataState('collapsed');
  }

  private async fillText(value: string) {
    const input = this.textbox;
    await input.click();
    await input.fill(value);
    await input.blur();
  }

  async collapse() {
    this.collapseBtn.click();
  }

  async expand() {
    this.expandBtn.click();
  }
}
