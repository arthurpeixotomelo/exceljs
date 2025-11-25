import Stream from 'stream';
import { PassThrough } from 'node:stream';

import Excel from '../../../lib/exceljs.nodejs.js';

describe('Workbook Writer', () => {
  it('returns undefined for non-existant sheet', () => {
    const stream = new PassThrough();
    const wb = new Excel.stream.xlsx.WorkbookWriter({
      stream,
    });
    wb.addWorksheet('first');
    expect(wb.getWorksheet('w00t')).toBeUndefined();
  });
});
