import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { Button } from './Button';
import { Message } from './Message';

export class Combobox {
  readonly parent: Locator;
  private readonly locator: Locator;
  private readonly options: Locator;
  private readonly toggleMenu: Button;

  constructor(
    readonly page: Page,
    parent: Locator,
    options?: { label?: string; nth?: number }
  ) {
    this.parent = parent;
    if (options?.label) {
      this.locator = parent.getByRole('combobox', { name: options.label, exact: true });
    } else {
      this.locator = parent.getByRole('combobox').nth(options?.nth ?? 0);
    }
    this.options = parent.getByRole('option');
    this.toggleMenu = new Button(parent, { name: 'toggle menu' });
  }

  async fill(value: string) {
    await this.locator.fill(value);
    await this.locator.blur();
  }

  async choose(value: string) {
    await this.toggleMenu.click();
    await this.page.getByRole('option', { name: value }).first().click();
  }

  async expectValue(value: string | RegExp) {
    await expect(this.locator).toHaveValue(value);
  }

  async expectOptions(...options: Array<string>) {
    await this.toggleMenu.click();
    await expect(this.options).toHaveCount(options.length);
    for (let i = 0; i < options.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await expect(this.options.nth(i)).toHaveText(options[i]!);
    }
    await this.toggleMenu.click();
  }

  async message() {
    const describedBy = await this.locator.getAttribute('aria-describedby');
    if (!describedBy) {
      throw new Error('aria-describedby attribute is missing');
    }
    return new Message(this.parent, describedBy);
  }
}
