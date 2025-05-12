import { expect, type Locator, type Page } from '@playwright/test';
import { Button } from './Button';
import { Table } from './Table';

export class EnumValues {
  private readonly table: Table;
  private readonly add: Button;
  private readonly delete: Button;

  constructor(page: Page, parent: Locator) {
    this.table = new Table(page, parent, ['text']);
    this.add = new Button(parent, { name: 'Add value' });
    this.delete = new Button(parent, { name: 'Delete value' });
  }

  async setFirstValue(value: string) {
    await this.table.cell(0, 0).fill(value);
  }

  async deleteValue(value: string) {
    const values: string[] = [];
    const rowCount = await this.table.rowCount();
    for (let row = 0; row < rowCount; row++) {
      const rowValue = await this.table.cell(row, 0).value();
      if (rowValue === null) {
        throw new Error('Row ' + row + ' does not have a value');
      }
      values.push(rowValue);
      if (rowValue === value) {
        await this.table.row(row).click();
        await this.delete.click();
        return;
      }
    }
    throw new Error('Value ' + value + ' not found. Found values ' + values);
  }

  async addValue(value: string) {
    await this.add.click();
    const rowCount = await this.table.rowCount();
    await this.table.cell(rowCount - 1, 0).fill(value);
  }

  async expectValues(...values: Array<string>) {
    await this.table.expectRowCount(values.length);
    for (let row = 0; row < values.length; row++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.table.cell(row, 0).expectValue(values[row]!);
    }
  }

  async expectToBeDisabled() {
    const rowCount = await this.table.rowCount();
    for (let row = 0; row < rowCount; row++) {
      await expect(this.table.row(row).locator.locator('.ui-input')).toBeDisabled();
    }
  }
}
