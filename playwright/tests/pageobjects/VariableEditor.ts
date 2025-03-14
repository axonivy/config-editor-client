import { expect, type Locator, type Page } from '@playwright/test';
import { AddVariableDialog } from './AddVariableDialog';
import { Button } from './Button';
import { Details } from './Details';
import { OverwriteDialog } from './OverwriteDialog';
import { Settings } from './Settings';
import { Table } from './Table';
import { TextArea } from './TextArea';
import { Toolbar } from './Toolbar';

export class VariableEditor {
  readonly page: Page;
  readonly toolbar: Toolbar;
  readonly search: TextArea;
  readonly tree: Table;
  readonly delete: Button;
  readonly add: AddVariableDialog;
  readonly locator: Locator;
  readonly settings: Settings;
  readonly details: Details;
  readonly masterPanel: Locator;
  readonly overwrite: OverwriteDialog;

  constructor(page: Page) {
    this.page = page;
    this.locator = page.locator(':root');
    this.masterPanel = this.locator.locator('.variables-editor-main-panel');
    this.toolbar = new Toolbar(page, this.masterPanel);
    this.search = new TextArea(this.locator);
    this.tree = new Table(page, this.locator, ['label', 'label'], { virtualized: true });
    this.delete = new Button(this.locator, { name: 'Delete variable' });
    this.add = new AddVariableDialog(page, this.locator);
    this.overwrite = new OverwriteDialog(page, this.locator);
    this.settings = new Settings(this.locator);
    this.details = new Details(this.page, this.locator);
  }

  static async openEngine(page: Page, options?: { readonly?: boolean }) {
    const server = process.env.BASE_URL ?? 'localhost:8081';
    const app = process.env.TEST_APP ?? 'designer';
    const serverUrl = server.replace(/^https?:\/\//, '');
    const pmv = 'variables-test-project';
    let url = `?server=${serverUrl}&app=${app}&pmv=${pmv}&file=config/variables.yaml`;
    if (options) {
      url += `${this.params(options)}`;
    }
    return this.openUrl(page, url);
  }

  static async openMock(page: Page, options?: { virtualize?: boolean }) {
    let url = 'mock.html';
    if (options) {
      url += '?';
      if (options.virtualize) {
        url += `virtualize=${options.virtualize}&`;
      }
    }
    return this.openUrl(page, url);
  }

  private static params(options: Record<string, string | boolean>) {
    let params = '';
    params += Object.entries(options)
      .map(([key, value]) => `&${key}=${value}`)
      .join('');
    return params;
  }

  private static async openUrl(page: Page, url: string) {
    const editor = new VariableEditor(page);
    await page.goto(url);
    return editor;
  }

  async takeScreenshot(fileName: string) {
    await this.hideQuery();
    const dir = process.env.SCREENSHOT_DIR ?? 'tests/screenshots/target';
    const buffer = await this.page.screenshot({ path: `${dir}/screenshots/${fileName}`, animations: 'disabled' });
    expect(buffer.byteLength).toBeGreaterThan(3000);
  }

  async hideQuery() {
    await this.page.addStyleTag({ content: `.tsqd-parent-container { display: none; }` });
  }

  async addVariable(name?: string, namespace?: string) {
    await this.add.open.click();
    if (name) {
      await this.add.name.fill(name);
    }
    if (namespace) {
      await this.add.namespace.fill(namespace);
    }
    await this.add.create.click();
  }
}
