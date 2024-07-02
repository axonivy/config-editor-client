import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { Button } from './Button';

export class Combobox {
  private readonly locator: Locator;
  private readonly options: Locator;
  private readonly toggleMenu: Button;

  constructor(readonly page: Page, parentLocator: Locator, options?: { label?: string; nth?: number }) {
    if (options?.label) {
      this.locator = parentLocator.getByRole('combobox', { name: options.label }).first();
    } else {
      this.locator = parentLocator.getByRole('combobox').nth(options?.nth ?? 0);
    }
    this.options = parentLocator.getByRole('option');
    this.toggleMenu = new Button(parentLocator, { name: 'toggle menu' });
  }

  async fill(value: string) {
    await this.locator.fill(value);
    await this.locator.blur();
  }

  async expectValue(value: string | RegExp) {
    await expect(this.locator).toHaveValue(value);
  }

  async expectOptions(...options: Array<string>) {
    await this.toggleMenu.click();
    await expect(this.options).toHaveCount(options.length);
    for (let i = 0; i < options.length; i++) {
      await expect(this.options.nth(i)).toHaveText(options[i]);
    }
  }
}
