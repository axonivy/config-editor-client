import { test } from '@playwright/test';
import type { Table } from '../pageobjects/Table';
import { VariableEditor } from '../pageobjects/VariableEditor';

test.describe('VariableEditor', () => {
  let editor: VariableEditor;
  let tree: Table;

  test.beforeEach(async ({ page }) => {
    editor = await VariableEditor.openMock(page);
    tree = editor.tree;
    await tree.expectRowCount(11);
  });

  test('title', async () => {
    await editor.expectTitle('Variables Editor Mock');
  });

  test('search', async () => {
    const search = editor.search;

    await search.fill('Hello');
    await search.expectValue('Hello');
    await tree.expectRowCount(0);

    await search.fill('useUser');
    await search.expectValue('useUser');
    await tree.expectRowCount(5);
    await tree.cell(0, 0).expectValue('microsoft-connector');
    await tree.cell(1, 0).expectValue('useUserPassFlow');
    await tree.cell(2, 0).expectValue('enabled');
    await tree.cell(3, 0).expectValue('user');
    await tree.cell(4, 0).expectValue('pass');
  });

  test('delete', async () => {
    const row = tree.row(6);
    await row.click();
    await row.expectValues(['enabled', 'false']);
    await row.expectSelected();

    await editor.delete.click();

    await tree.expectRowCount(10);
    await row.expectValues(['user', 'MyUser']);
    await row.expectSelected();
  });

  test('delete last child', async () => {
    const row = tree.row(8);
    await row.click();
    await row.expectValues(['pass', '***']);
    await row.expectSelected();

    await editor.delete.click();

    await tree.expectRowCount(10);
    await row.column(0).expectValue('permissions');
    await row.expectNotSelected();
    const previousRow = tree.row(7);
    await previousRow.expectValues(['user', 'MyUser']);
    await previousRow.expectSelected();
  });

  test('delete last remaining child', async () => {
    const row = tree.row(6);
    await row.click();
    await editor.delete.click();
    await editor.delete.click();
    await row.expectValues(['pass', '***']);

    await editor.delete.click();

    await tree.expectRowCount(8);
    await row.column(0).expectValue('permissions');
    await row.expectNotSelected();
    const parentRow = tree.row(5);
    await parentRow.expectValues(['useUserPassFlow', '']);
    await parentRow.expectSelected();
  });

  test('add', async () => {
    await tree.row(5).click();
    await tree.row(5).expectValues(['useUserPassFlow', '']);
    await editor.addVariable();
    await tree.expectRowCount(12);
  });

  test('addVariableDialogDefaultValues', async () => {
    await tree.row(5).click();
    await tree.row(5).expectValues(['useUserPassFlow', '']);
    await editor.add.open();
    await editor.add.expectValues('NewVariable', 'microsoft-connector.useUserPassFlow', 'microsoft-connector', 'microsoft-connector.useUserPassFlow');
  });

  test('collapse', async () => {
    const row = tree.row(5);
    await row.expectExpanded();
    await row.collapse();
    await row.expectCollapsed();
    await tree.expectRowCount(8);
  });

  test('expand', async () => {
    const row = tree.row(5);
    await row.collapse();
    await tree.expectRowCount(8);
    await row.expectCollapsed();
    await row.expand();
    await row.expectExpanded();
    await tree.expectRowCount(11);
  });

  test('theme', async () => {
    const settings = editor.settings;
    await settings.toggle();
    await settings.theme.expectLight();
    await settings.theme.toggle();
    await settings.theme.expectDark();
  });

  test('password', async () => {
    await editor.tree.row(2).expectValues(['secretKey', '***']);
  });
});
