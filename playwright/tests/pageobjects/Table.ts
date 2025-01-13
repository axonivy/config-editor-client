import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { Button } from './Button';
import { Message } from './Message';

export class Table {
  readonly locator: Locator;
  private readonly rows: Locator;
  private readonly header: Locator;
  readonly messages: Locator;

  constructor(readonly page: Page, parentLocator: Locator, readonly columns: ColumnType[], label?: string) {
    if (label === undefined) {
      this.locator = parentLocator.locator('table');
    } else {
      this.locator = parentLocator.getByLabel(label);
    }
    this.rows = this.locator.locator('tbody tr:not(.ui-message-row)');
    this.messages = this.locator.locator('tbody tr.ui-message-row');
    this.header = this.locator.locator('thead tr');
  }

  row(row: number) {
    return new Row(this.page, this.rows, this.header, row, this.columns);
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
    for (let i = 0; i < (await this.rows.count()); i++) {
      await this.row(i).expectNotSelected();
    }
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
  public readonly header: Locator;

  constructor(readonly page: Page, rowsLocator: Locator, headerLocator: Locator, row: number, readonly columns: ColumnType[]) {
    this.locator = rowsLocator.nth(row);
    this.header = headerLocator.nth(0);
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
    await expect(this.locator).toHaveAttribute('data-state', 'selected');
  }

  async expectNotSelected() {
    await expect(this.locator).not.toHaveAttribute('data-state', 'selected');
  }

  async expectCollapsed() {
    await this.column(0).expectCollapsed();
  }

  async expectExpanded() {
    await this.column(0).expectExpanded();
  }

  async expectToHaveNoValidation() {
    await expect(this.locator).not.toHaveClass(/row-error/);
    await expect(this.locator).not.toHaveClass(/row-warning/);
  }

  async expectToHaveError() {
    await expect(this.locator).toHaveClass(/row-error/);
  }

  async expectToHaveWarning() {
    await expect(this.locator).toHaveClass(/row-warning/);
  }
}

export class Cell {
  private readonly locator: Locator;
  private readonly textbox: Locator;
  private readonly collapseBtn: Button;
  private readonly expandBtn: Button;

  constructor(readonly page: Page, rowLocator: Locator, column: number, readonly columnType: ColumnType) {
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
