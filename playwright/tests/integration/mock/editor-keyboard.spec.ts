import test, { expect } from '@playwright/test';
import type { Table } from '../../pageobjects/Table';
import { VariableEditor } from '../../pageobjects/VariableEditor';

let editor: VariableEditor;
let tree: Table;

test.beforeEach(async ({ page }) => {
  editor = await VariableEditor.openMock(page, { virtualize: true });
  tree = editor.tree;
  await tree.expectNotEmpty();
});

test('move single selection via arrowKey', async () => {
  await editor.tree.expectToHaveNothingSelected();
  await editor.tree.locator.focus();
  await editor.page.keyboard.press('ArrowDown');
  await editor.page.keyboard.press('ArrowDown');
  await editor.tree.expectToBeSelected(1);
  await editor.page.keyboard.press('ArrowUp');
  await editor.page.keyboard.press('ArrowUp');
  await editor.page.keyboard.press('ArrowUp');
  await editor.tree.expectToBeSelected(60);
});

test('open/close children via arrowKey', async () => {
  await editor.tree.expectToHaveNothingSelected();
  await editor.tree.locator.getByRole('button', { name: 'Collapse tree' }).click();
  await editor.tree.locator.focus();
  await editor.page.keyboard.press('ArrowDown');
  await editor.tree.expectRowCount(2);
  await editor.page.keyboard.press('ArrowRight');
  await editor.tree.expectRowCount(9);
  await editor.page.keyboard.press('ArrowLeft');
  await editor.tree.expectRowCount(2);
});

test('open/close detail via enter', async () => {
  await editor.tree.expectToHaveNothingSelected();
  await expect(editor.details.locator).toBeVisible();
  await editor.tree.locator.focus();
  await editor.page.keyboard.press('ArrowDown');
  await editor.page.keyboard.press('Enter');
  await expect(editor.details.locator).toBeHidden();
  await editor.page.keyboard.press('ArrowDown');
  await editor.page.keyboard.press('ArrowDown');
  await editor.page.keyboard.press('Enter');
  await expect(editor.details.locator).toBeVisible();
  await editor.details.expectTitle('Variables - project-name - secretKey');
});
