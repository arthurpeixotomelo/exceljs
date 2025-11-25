import { describe, it, expect } from 'vitest';
import ExcelJS from '../../../excel.js';

const { Workbook } = ExcelJS;

describe('Worksheet Protection', () => {
  it('should protect worksheet with password', async () => {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Test');

    ws.getCell('A1').value = 1;
    ws.getCell('B1').value = 2;

    await ws.protect('password');

    // Check that protection is set (though we can't verify the password without reading back)
    expect(ws.sheetProtection).toBeDefined();
  });

  it('should set cell-level protection', () => {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Test');

    ws.getCell('A1').protection = { locked: false };
    ws.getCell('B1').protection = { hidden: true };

    expect(ws.getCell('A1').protection.locked).toBe(false);
    expect(ws.getCell('B1').protection.hidden).toBe(true);
  });

  it('should handle formulas with protection', () => {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Test');

    ws.getCell('A1').value = { formula: '1+2', result: 3 };
    ws.getCell('A1').protection = { hidden: true };

    expect(ws.getCell('A1').value.result).toBe(3);
    expect(ws.getCell('A1').protection.hidden).toBe(true);
  });
});