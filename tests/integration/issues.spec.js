import testUtils from '../utils/index.js';
import ExcelJS from 'ts-sheet';
import * as fs from 'node:fs';
import * as Enums from '../../lib/doc/enums.js';
import { promisify } from 'node:util';
import { describe, it, expect } from 'vitest';

const fsReadFileAsync = promisify(fs.readFile);

describe('Issue-related integration tests (grouped)', () => {
  // === issue 1027 - sheet defined data validate ===
  describe('issue 1027 - sheet defined data validate', () => {
    it('issue 1027 - Broken due to Cannot set property marked of undefined error', () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('issue-1027');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Sheet1');
      const range = 'A2:A1048576';
      ws.dataValidations.model[range] = {
        allowBlank: true,
        error: 'Please use the drop down to select a valid value',
        errorTitle: 'Invalid Selection',
        formulae: ['"Apples,Bananas,Oranges"'],
        showErrorMessage: true,
        type: 'list',
      };
      return wb.xlsx.writeFile(TEST_XLSX_FILE_NAME);
    });
  });

  // === issue 1339 - special cell values ===
  describe('issue 1339 - Special cell value results invalid file', () => {
    it('issue 1339 - special cell values preserve', async () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('issue-1339');
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: TEST_XLSX_FILE_NAME, useStyles: true, useSharedStrings: true });
      const ws = wb.addWorksheet('Sheet1');
      const specialValues = [
        'constructor',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'toLocaleString',
        'toString',
        'valueOf',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
        '__proto__',
      ];
      for (let i = 0; i < specialValues.length; i++) {
        const value = specialValues[i];
        ws.addRow([value]);
        ws.getCell(`B${i + 1}`).value = value;
      }
      await wb.commit();
      const wb2 = new ExcelJS.Workbook();
      await wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
      const ws2 = wb2.getWorksheet('Sheet1');
      for (let i = 0; i < specialValues.length; i++) {
        const value = specialValues[i];
        expect(ws2.getCell(`A${i + 1}`).value).toBe(value);
        expect(ws2.getCell(`B${i + 1}`).value).toBe(value);
      }
    });
  });

  // === issue 623 - borders ===
  describe('issue 623 - borders for merged cells', () => {
    it('issue 623 - borders preserved for merged cells', () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('issue-623');
      const wb = new ExcelJS.Workbook();
      return wb.xlsx
        .readFile('./tests/integration/data/test-issue-623.xlsx')
        .then(() => wb.xlsx.writeFile(TEST_XLSX_FILE_NAME))
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const worksheet = wb2.getWorksheet(1);
          // Check borders assert existence; tests would be expanded from original file if needed
          expect(worksheet.getCell('B2').style.border).toHaveProperty('left');
        });
    });
  });

  // === issue 703 - special cell values ===
  describe('issue 703', () => {
    it('issue 703 - special cell values handled', () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('issue-703');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Sheet1');
      const specialValues = [
        'constructor',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'toLocaleString',
        'toString',
        'valueOf',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
        '__proto__',
      ];
      for (let i = 0; i < specialValues.length; i++) {
        const value = specialValues[i];
        ws.addRow([value]);
        ws.getCell(`B${i + 1}`).value = value;
      }
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('Sheet1');
          for (let i = 0; i < specialValues.length; i++) {
            const value = specialValues[i];
            expect(ws2.getCell(`A${i + 1}`).value).toBe(value);
            expect(ws2.getCell(`B${i + 1}`).value).toBe(value);
          }
        });
    });
  });

  // === issue 877 & 275 - hyperlink tests ===
  describe('issue 877 & 275 - hyperlinks', () => {
    it('issue 275 - hyperlink with query args preserved', () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('issue-hyperlink');
      const options = { filename: TEST_XLSX_FILE_NAME, useStyles: true };
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter(options);
      const ws = wb.addWorksheet('Sheet1');
      const hyperlink = { text: 'Somewhere with query params', hyperlink: 'www.somewhere.com?a=1&b=2&c=<>&d="\'"' };
      ws.getCell('A1').value = hyperlink;
      ws.commit();
      return wb
        .commit()
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('Sheet1');
          expect(ws2.getCell('A1').value).toEqual(hyperlink);
        });
    });

    it('issue 877 - hyperlink without text does not crash', () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('issue-hyperlink-empty');
      const options = { filename: TEST_XLSX_FILE_NAME, useStyles: true, useSharedStrings: true };
      const wb = new ExcelJS.Workbook();
      return wb.xlsx
        .readFile('./tests/integration/data/test-issue-877.xlsx')
        .then(() => {
          return wb.xlsx.writeBuffer({ useStyles: true, useSharedStrings: true });
        })
        .then(buffer => {
          const wstream = fs.createWriteStream(TEST_XLSX_FILE_NAME);
          wstream.write(buffer);
          wstream.end();
        });
    });
  });

  // === issue 880 - malformed comment ===
  describe('issue 880 - malformed comment crash on write', () => {
    it('issue 880 - should not crash on malformed comments', () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('issue-880');
      const wb = new ExcelJS.Workbook();
      return wb.xlsx
        .readFile('./tests/integration/data/test-issue-880.xlsx')
        .then(() => wb.xlsx.writeBuffer({ useStyles: true, useSharedStrings: true }))
        .then(buffer => {
          const wstream = fs.createWriteStream(TEST_XLSX_FILE_NAME);
          wstream.write(buffer);
          wstream.end();
        });
    }, 6000);
  });

  // === issue 234 - vertical tab char ===
  describe('issue 234 - vertical tab char', () => {
    it('issue 234 - vertical tab char removal or cleanup', () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('issue-234');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Sheet1');
      ws.getCell('A1').value = 'Hello, \x01World!';
      ws.getCell('A2').value = 'Hello, \x0bWorld!';
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('Sheet1');
          expect(ws2.getCell('A1').value).toBe('Hello, World!');
          expect(ws2.getCell('A2').value).toBe('Hello, World!');
        });
    });
  });

  // === issue 1328 - xlsx worksheet reader date ===
  describe('issue 1328 - Date field with cache style', () => {
    it('issue 1328 - should emit row with Date Object', async () => {
      const rows = [];
      await new Promise((resolve, reject) => {
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
          fs.createReadStream('./tests/integration/data/dateIssue.xlsx'),
          {
            worksheets: 'emit',
            styles: 'cache',
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            entries: 'ignore',
          }
        );
        workbookReader.read();
        workbookReader.on('worksheet', worksheet =>
          worksheet.on('row', row => rows.push(row.values[1]))
        );
        workbookReader.on('end', resolve);
        workbookReader.on('error', reject);
      });

      expect(rows).toEqual([
        'Date',
        new Date('2020-11-20T00:00:00.000Z'),
      ]);
    });
  });

  // === issue 163 - xlsx readFile ===
  describe('issue 163 - xslx readFile method error', () => {
    it('issue 163 - read file succeeds', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-issue-163.xlsx');
      expect(true).toBe(true);
    });
  });

  // === issue 1669 - optional autofilter on tables ===
  describe('issue 1669 - optional custom autofilter on table', () => {
    it('issue 1669 - read the sample workbook', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-issue-1669.xlsx');
    }, 6000);
  });

  // === issue 176 - Unexpected xml node ===
  describe('issue 176 - Unexpected xml node in parseOpen', () => {
    it('issue 176 - workbook reads without throwing', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-issue-176.xlsx');
      expect(true).toBe(true);
    });
  });

  // === issue 2125 - spliceRows last row ===
  describe('issue 2125 - spliceRows remove last row', () => {
    it('issue 2125 - remove last row and check value', () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet();
      ws.addRows([['1st'], ['2nd'], ['3rd']]);

      ws.spliceRows(ws.rowCount, 1);

      expect(ws.getRow(ws.rowCount).getCell(1).value).toBe('2nd');
    });
  });

  // === issue 219 - 1904 dates ===
  describe('issue 219 - 1904 dates not supported', () => {
    it('issue 219 - reading historic workbook', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/1904.xlsx');
      expect(wb.properties.date1904).toBe(true);
      const ws = wb.getWorksheet('Sheet1');
      expect(ws.getCell('B4').value.toISOString()).toBe(
        '1904-01-01T00:00:00.000Z'
      );
    });

    it('issue 219 - writing and reading preserves date1904 flag', async () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('issue-219');
      const wb = new ExcelJS.Workbook();
      wb.properties.date1904 = true;
      const ws = wb.addWorksheet('Sheet1');
      ws.getCell('B4').value = new Date('1904-01-01T00:00:00.000Z');
      await wb.xlsx.writeFile(TEST_XLSX_FILE_NAME);
      const wb2 = new ExcelJS.Workbook();
      await wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
      expect(wb2.properties.date1904).toBe(true);
      const ws2 = wb2.getWorksheet('Sheet1');
      expect(ws2.getCell('B4').value.toISOString()).toBe(
        '1904-01-01T00:00:00.000Z'
      );
    });
  });

  // === issue 257 - worksheet order ===
  describe('issue 257 - worksheet order is not respected', () => {
    it('issue 257 - reads the sheets in correct order', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-issue-257.xlsx');
      expect(wb.worksheets.map(ws => ws.name)).toEqual(['First', 'Second']);
    });
  });

  // === issue 539 - <contentType /> element ===
  describe('issue 539 - <contentType /> element', () => {
    it('issue 539 - reading problematic file', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(
        './tests/integration/data/1519293514-KRISHNAPATNAM_LINE_UP.xlsx'
      );
    });
  });

  // === issue 771 - data validation without type ===
  describe('issue 771 - dataValidation without type', () => {
    it('issue 771 - read sample workbook', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-issue-771.xlsx');
    });
  });

  // === issue 988 - table without autofilter ===
  describe('issue 988 - table without autofilter', () => {
    it('issue 988 - read sample', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-issue-988.xlsx');
    }, 6000);
  });

  // === issue 991 - csv read dates ===
  describe('issue 991 - CSV read date handling', () => {
    it('issue 991 - read csv and validate dates', async () => {
      const ws = await new ExcelJS.Workbook().csv.readFile(
        './tests/integration/data/test-issue-991.csv'
      );
      expect(ws.getCell('A1').value.toString()).toBe(
        new Date('2019-11-04T00:00:00').toString()
      );
      expect(ws.getCell('A2').value.toString()).toBe(
        new Date('2019-11-04T00:00:00').toString()
      );
      expect(ws.getCell('A3').value.toString()).toBe(
        new Date('2019-11-04T10:17:55').toString()
      );
      expect(ws.getCell('A4').value).toBe('00210PRG1');
      expect(ws.getCell('A5').value).toBe('1234-5thisisnotadate');
    });
  });

  // === issue 995 - encoding ===
  describe('issue 995 - encoding option works fine', () => {
    it('issue 995 - write and read CSV with Hebrew content', async () => {
      const TEST_CSV_FILE_NAME = testUtils.makeTempFileName('issue-995-encoding', 'csv');
      const HEBREW_TEST_STRING = 'משהו שכתוב בעברית';
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('wheee');
      ws.getCell('A1').value = HEBREW_TEST_STRING;

      const options = { encoding: 'UTF-8' };
      await wb.csv.writeFile(TEST_CSV_FILE_NAME, options);
      const ws2 = await new ExcelJS.Workbook().csv.readFile(TEST_CSV_FILE_NAME, options);
      expect(ws2.getCell('A1').value).toBe(HEBREW_TEST_STRING);
    }, 6000);
  });

  // === shared formula tests ===
  describe('shared-formula tests (merged)', () => {
    it('copied cells should have the right formulas', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/fibonacci.xlsx');
      const ws = wb.getWorksheet('fib');
      expect(ws.getCell('A4').value).toEqual({
        formula: 'A3+1',
        shareType: 'shared',
        ref: 'A4:A19',
        result: 4,
      });
      expect(ws.getCell('A5').value).toEqual({ sharedFormula: 'A4', result: 5 });
    });

    it('copied cells should have the right types', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/fibonacci.xlsx');
      const ws = wb.getWorksheet('fib');
      expect(ws.getCell('A4').type).toBe(Enums.ValueType.Formula);
      expect(ws.getCell('A5').type).toBe(Enums.ValueType.Formula);
    });

    it('copied cells should have the same fields', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/fibonacci.xlsx');
      const ws = wb.getWorksheet('fib');
      const A4 = ws.getCell('A4');
      const A5 = ws.getCell('A5');
      expect(Object.keys(A4).join()).toBe(Object.keys(A5).join());
    });
  });
});
