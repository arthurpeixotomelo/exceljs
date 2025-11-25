import { describe, it, expect } from 'vitest';
import ExcelJS from '../../../excel.js';

const { Workbook } = ExcelJS;

describe('Formulas', () => {
  it('should set fill formulas correctly', () => {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Test');

    ws.fillFormula('A1:B2', 'ROW()+COLUMN()', [
      [2, 3],
      [3, 4],
    ]);

    expect(ws.getCell('A1').value.formula).toBe('ROW()+COLUMN()');
    expect(ws.getCell('A1').value.result).toBe(2);
    expect(ws.getCell('B1').value.result).toBe(3);
  });

  it('should set shared formulas correctly', () => {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Test');

    ws.getCell('A1').value = { formula: 'ROW()', result: 1 };
    ws.getCell('A2').value = { sharedFormula: 'A1', result: 2 };

    expect(ws.getCell('A1').value.formula).toBe('ROW()');
    expect(ws.getCell('A1').value.result).toBe(1);
    expect(ws.getCell('A2').value.sharedFormula).toBe('A1');
    expect(ws.getCell('A2').value.result).toBe(2);
  });

  it('should handle array formulas', () => {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Test');

    ws.getCell('A1').value = {
      shareType: 'array',
      ref: 'A1:B2',
      formula: 'SUM(1,2)',
      result: 3,
    };

    expect(ws.getCell('A1').value.shareType).toBe('array');
    expect(ws.getCell('A1').value.formula).toBe('SUM(1,2)');
    expect(ws.getCell('A1').value.result).toBe(3);
  });
});