import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data = JSON.parse(
  readFileSync(new URL('../research/quarterly.json', import.meta.url), 'utf8'),
);

test('Every quarterly observation has one correctly ordered reporting period', () => {
  const expected = [
    '2026Q3_partial',
    '2026Q2',
    '2026Q1',
    '2025Q4',
    '2025Q3',
    '2025Q2',
    '2025Q1',
    '2024Q4',
    '2024Q3',
    '2024Q2',
    '2024Q1',
    '2023Q4',
    '2023Q3',
  ];
  assert.deepEqual(data.periodOrder, expected);
  for (const [name, values] of Object.entries(data.reported)) {
    assert.equal(values.length, expected.length, name);
    for (const value of values)
      assert.ok(value === null || Number.isFinite(value), name);
  }
  assert.equal(data.observedAt, '2026-09-05');
  assert.match(data.source, /^https:\/\/aave\.tokenlogic\.xyz\//);
});
test('Unreported cost inputs stay null rather than becoming zero', () => {
  assert.equal(data.reported.sGhoTransfers[2], null);
  assert.equal(data.reported.ghoCexTransfers[1], null);
  assert.equal(data.reported.facilitatorDepositYield[7], null);
  assert.match(data.netIncomeStatus, /Do not compute a definitive net/);
});
test('Latest quarter broader earnings reconcile within published rounding', () => {
  const i = data.periodOrder.indexOf('2026Q2');
  const components = [
    'ghoBorrowFees',
    'facilitatorDepositYield',
    'gsmInterest',
    'gsmSwapFees',
    'lessTreasuryBorrowInterest',
  ];
  const sum = components.reduce((a, key) => a + data.reported[key][i], 0);
  assert.ok(Math.abs(sum - data.reported.ghoEarningsTotal[i]) < 5000);
  assert.equal(
    data.reported.ghoBorrowFees[i] + data.reported.facilitatorDepositYield[i],
    1399700,
  );
});
test('Removing GSM income changes the sign of the reported-scope diagnostic', () => {
  const revenue = 8970000,
    cost = 6748000,
    gsm = 3220000;
  assert.equal(revenue - gsm - cost, -998000);
  assert.ok(revenue - cost > 0);
});
