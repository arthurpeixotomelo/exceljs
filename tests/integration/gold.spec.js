import Excel from 'ts-sheet';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// =============================================================================
// This spec is based around a gold standard Excel workbook 'gold.xlsx'

describe('Gold Book', () => {
  describe('Read', () => {
    let wb;
    beforeEach(() => {
      wb = new Excel.Workbook();
      return wb.xlsx.readFile(`${__dirname}/data/gold.xlsx`);
    });

    it('Values', () => {
      const ws = wb.getWorksheet('Values');

      expect(ws.getCell('B1').value).toBe('I am Text');
      expect(ws.getCell('B2').value).toBe(3.14);
      expect(ws.getCell('B3').value).toBe(5);
      // const b4 = ws.getCell('B4').value;
      // console.log(typeof b4, b4);
      expect(ws.getCell('B4').value).toEqual(
        new Date('2016-05-17T00:00:00.000Z')
      );
      expect(ws.getCell('B5').value).toEqual({
        formula: 'B1',
        result: 'I am Text',
      });

      expect(ws.getCell('B6').value).toEqual({
        hyperlink: 'https://www.npmjs.com/package/exceljs',
        text: 'exceljs',
      });

      expect(ws.lastColumn).toBe(ws.getColumn(2));
      expect(ws.lastRow).toBe(ws.getRow(6));
    });

    it('Styles', () => {});
  });
});
