import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { Button } from './Button';

export class Table {
  private readonly rows: Locator;
  private readonly header: Locator;
  private readonly locator: Locator;
  private readonly validations: Locator;

  constructor(readonly page: Page, parentLocator: Locator, readonly columns: ColumnType[], label?: string) {
    if (label === undefined) {
      this.locator = parentLocator;
    } else {
      this.locator = parentLocator.getByLabel(label);
    }
    this.rows = this.locator.locator('tbody tr:not(.ui-message-row)');
    this.validations = this.locator.locator('tbody tr.ui-message-row');
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

  async rowCount() {
    return await this.rows.count();
  }

  validation(index: number) {
    return new Validation(this.validations.nth(index));
  }

  async expectValidationCount(count: number) {
    await expect(this.validations).toHaveCount(count);
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

export class Validation {
  locator: Locator;
  constructor(locator: Locator) {
    this.locator = locator;
  }

  async expectText(text: string) {
    await expect(this.locator).toHaveText(text);
  }
}
