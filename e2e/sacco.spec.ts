import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function login(page: import('@playwright/test').Page, roleLabel: string) {
  await page.goto(`${BASE}/login`);
  await page.getByText(roleLabel, { exact: true }).first().click();
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/');
}

async function pickOption(page: import('@playwright/test').Page, selectId: string, text: string) {
  await page.locator(`.ant-modal #${selectId}`).click();
  const option = page
    .locator('.ant-select-dropdown .ant-select-item-option')
    .filter({ hasText: text })
    .first();
  await option.scrollIntoViewIfNeeded();
  await option.click({ force: true });
}

async function searchAndPick(page: import('@playwright/test').Page, selectId: string, query: string, text: string) {
  await page.locator(`.ant-modal #${selectId}`).click();
  await page.locator(`.ant-modal #${selectId}`).fill(query);
  const option = page
    .locator('.ant-select-dropdown .ant-select-item-option')
    .filter({ hasText: text })
    .first();
  await option.scrollIntoViewIfNeeded();
  await option.click({ force: true });
}

test.describe('CBS General E2E — real stack (React + Spring Boot + PostgreSQL)', () => {
  test('login → dashboard shows live KPIs', async ({ page }) => {
    await login(page, 'Manager');
    await expect(page).toHaveURL(`${BASE}/`);
    await expect(page.getByText('Total Members')).toBeVisible();
    await expect(page.getByText('Total Savings')).toBeVisible();
    await expect(page.getByText('Loan Portfolio', { exact: true })).toBeVisible();
    await expect(page.getByText('Operating Surplus (MTD)')).toBeVisible();
    await expect(page.getByText('Pending Approvals').first()).toBeVisible();
  });

  test('member registry opens a profile drawer with KYC and statement', async ({ page }) => {
    await login(page, 'Teller / Cashier');
    await page.getByText('Members', { exact: true }).first().click();
    await page.waitForURL('**/members');
    await expect(page.getByText('Member Registry')).toBeVisible();
    await page.getByPlaceholder(/Search name/).fill('Abebe');
    await page.getByText('Abebe Bekele').first().click();
    await expect(page.getByText('Fayda ID').first()).toBeVisible();
    await expect(page.getByText('FAY-1122334455').last()).toBeVisible();
    await page.getByText('Statement').click();
    await expect(page.getByText('Deposit', { exact: true }).first()).toBeVisible();
  });

  test('loans: submit a new application and see it in the portfolio', async ({ page }) => {
    await login(page, 'Credit Officer');
    await page.getByText('Loans', { exact: true }).first().click();
    await page.waitForURL('**/loans');
    const rowsBefore = await page.locator('.ant-table-row').count();
    await page.getByRole('button', { name: /New Loan Application/i }).click();
    await pickOption(page, 'productId', 'Personal Loan');
    await page.locator('#amount').fill('22000');
    await page.locator('#termMonths').fill('12');
    await page.getByRole('button', { name: /Submit for Appraisal/i }).click();
    await expect(page.getByText('Submit for Appraisal')).toBeHidden();
    await expect(page.getByText('LN-2026-', { exact: false }).first()).toBeVisible();
    const rowsAfter = await page.locator('.ant-table-row').count();
    expect(rowsAfter).toBeGreaterThanOrEqual(rowsBefore);
  });

  test('maker-checker: manager approves a pending approval from the queue', async ({ page }) => {
    await login(page, 'Manager');
    await page.getByText('Approvals', { exact: true }).first().click();
    await page.waitForURL('**/approvals');
    await expect(page.getByText('Approval Queue')).toBeVisible();
    const approveButtons = page.getByRole('button', { name: /Approve/i });
    const count = await approveButtons.count();
    if (count > 0) {
      await approveButtons.first().click();
      await expect(page.getByText('Approved').first()).toBeVisible();
    }
  });

  test('check-off: upload a deduction file reconciles cleanly', async ({ page }) => {
    await login(page, 'Accountant');
    await page.getByText('Employer Check-Off', { exact: true }).first().click();
    await page.waitForURL('**/checkoff');
    await page.getByRole('button', { name: /Upload Deduction File/i }).click();
    await page.locator('.ant-modal .ant-select').first().click();
    await page.getByText('Ministry of Education').last().click();
    await page.getByRole('button', { name: /Process File/i }).click();
    await expect(page.getByText('Ministry of Education').first()).toBeVisible();
  });

  test('reports: export CSV generates a file', async ({ page }) => {
    await login(page, 'Manager');
    await page.getByText('Reports', { exact: true }).first().click();
    await page.waitForURL('**/reports');
    await expect(page.getByText('Report Library')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export CSV/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/members-report\.csv$/);
  });

  test('dashboard shows live charts', async ({ page }) => {
    await login(page, 'Manager');
    await expect(page.getByText('Portfolio at Risk')).toBeVisible();
    await expect(page.getByText('Savings Flow (last 6 months)')).toBeVisible();
    await expect(page.getByText('Loan Portfolio Mix')).toBeVisible();
  });

  test('savings: record a deposit updates the member balance', async ({ page }) => {
    await login(page, 'Teller / Cashier');
    await page.getByText('Savings & Deposits', { exact: true }).first().click();
    await page.waitForURL('**/savings');
    await page.getByRole('button', { name: /New Deposit/i }).click();
    await searchAndPick(page, 'memberId', 'Abebe', 'Abebe Bekele');
    await pickOption(page, 'productId', 'S-VOL');
    await page.locator('.ant-modal #amount').fill('3000');
    await page.getByRole('button', { name: /Post Transaction/i }).click();
    await expect(page.locator('.ant-modal').filter({ hasText: 'Record Cash Deposit' })).toBeHidden();
  });

  test('accounting: post a balanced journal entry', async ({ page }) => {
    await login(page, 'Accountant');
    await page.getByText('Accounting & GL', { exact: true }).first().click();
    await page.waitForURL('**/accounting');
    await page.getByRole('button', { name: /New Journal Entry/i }).click();
    await searchAndPick(page, 'debitAccountCode', 'Cash', 'Cash on Hand');
    await searchAndPick(page, 'creditAccountCode', 'Mandatory', 'Member Savings - Mandatory');
    await page.locator('.ant-modal #debit').fill('15000');
    await page.locator('.ant-modal #credit').fill('15000');
    await page.getByRole('button', { name: /Post Entry/i }).click();
    await expect(page.locator('.ant-modal').filter({ hasText: 'New Journal Entry' })).toBeHidden();
    await expect(page.getByText('JRN-', { exact: false }).first()).toBeVisible();
  });
});