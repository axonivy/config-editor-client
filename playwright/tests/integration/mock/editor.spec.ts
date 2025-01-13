import { expect, test } from '@playwright/test';
import type { Table } from '../../pageobjects/Table';
import { VariableEditor } from '../../pageobjects/VariableEditor';

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
  await editor.addVariable('NewVariable', 'microsoft-connector.New.Namespace');
  await tree.expectRowCount(14);
  await tree.row(11).expectValues(['New', '']);
  await tree.row(12).expectValues(['Namespace', '']);
  await tree.row(13).expectValues(['NewVariable', '']);
});

test('addVariableDialogDefaultValues', async () => {
  await tree.row(5).click();
  await tree.row(5).expectValues(['useUserPassFlow', '']);
  await editor.add.open.click();
  await editor.add.expectValues('NewVariable', 'microsoft-connector.useUserPassFlow', 'microsoft-connector', 'microsoft-connector.useUserPassFlow');
});

test.describe('addVariableDialogValidation', () => {
  test.describe('name', () => {
    test('onNameChange', async () => {
      const add = editor.add;
      await add.open.click();
      const nameMessage = await add.name.message();
      await nameMessage.expectToBeHidden();
      await expect(add.create.locator).toBeEnabled();
      await add.name.fill('');
      await nameMessage.expectToBeError('Name cannot be empty.');
      await expect(add.create.locator).toBeDisabled();
      await add.name.fill('microsoft-connector');
      await nameMessage.expectToBeError('Name is already present in this Namespace.');
      await expect(add.create.locator).toBeDisabled();
    });

    test('onNamespaceChange', async () => {
      const add = editor.add;
      await add.open.click();
      const nameMessage = await add.name.message();
      await add.name.fill('appId');
      await nameMessage.expectToBeHidden();
      await expect(add.create.locator).toBeEnabled();
      await add.namespace.choose('microsoft-connector');
      await nameMessage.expectToBeError('Name is already present in this Namespace.');
      await expect(add.create.locator).toBeDisabled();
    });

    test('onNamespaceInput', async () => {
      const add = editor.add;
      await add.open.click();
      const nameMessage = await add.name.message();
      await add.name.fill('appId');
      await nameMessage.expectToBeHidden();
      await expect(add.create.locator).toBeEnabled();
      await add.namespace.fill('microsoft-connector');
      await nameMessage.expectToBeError('Name is already present in this Namespace.');
      await expect(add.create.locator).toBeDisabled();
    });
  });

  test('namespace', async () => {
    const add = editor.add;
    await add.open.click();
    const namespaceMessage = await add.namespace.message();
    await namespaceMessage.expectToBeInfo("Folder structure of variable (e.g. 'Connector.Key')");
    await expect(add.create.locator).toBeEnabled();
    await add.namespace.fill('microsoft-connector.appId.New.Namespace');
    await namespaceMessage.expectToBeError("Namespace 'microsoft-connector.appId' is not a folder, you cannot add a child to it.");
    await expect(add.create.locator).toBeDisabled();
  });
});

test.describe('table keyboard support', () => {
  test('move single selection via arrowKey', async () => {
    await editor.tree.expectToHaveNothingSelected();
    await editor.tree.locator.focus();
    await editor.page.keyboard.press('ArrowDown');
    await editor.page.keyboard.press('ArrowDown');
    await editor.tree.expectToBeSelected(1);
    await editor.page.keyboard.press('ArrowUp');
    await editor.page.keyboard.press('ArrowUp');
    await editor.page.keyboard.press('ArrowUp');
    await editor.tree.expectToBeSelected(9);
  });

  test('open/close children via arrowKey', async () => {
    await editor.tree.expectToHaveNothingSelected();
    await editor.tree.locator.focus();
    await editor.page.keyboard.press('ArrowDown');
    await editor.tree.expectRowCount(11);
    await editor.page.keyboard.press('ArrowLeft');
    await editor.tree.expectRowCount(1);
    await editor.page.keyboard.press('ArrowRight');
    await editor.tree.expectRowCount(11);
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
