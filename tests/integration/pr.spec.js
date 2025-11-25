import testUtils from '../utils/index.js';
import ExcelJS from 'ts-sheet';
import { describe, it, expect } from 'vitest';

// Consolidated PR tests

describe('PR-related integration tests (grouped)', () => {
  // === PR 1157 ===
  describe('pr 1157 - Read and write data validation should be successful', () => {
    it('pull request 1204 - Read and write data validation should be successful', async () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('pr-1157');
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-pr-1204.xlsx');
      const expected = {
        E1: {
          type: 'textLength',
          formulae: [2],
          showInputMessage: true,
          showErrorMessage: true,
          operator: 'greaterThan',
        },
        E4: {
          type: 'textLength',
          formulae: [2],
          showInputMessage: true,
          showErrorMessage: true,
          operator: 'greaterThan',
        },
      };
      const ws = wb.getWorksheet(1);
      expect(ws.dataValidations.model).toEqual(expected);
      await wb.xlsx.writeFile(TEST_XLSX_FILE_NAME);
    });
  });

  // === PR 1334 ===
  describe('pr 1334 - Fix the error that comment does not delete at spliceColumn', () => {
    it('pull request 1334 should preserve comments after spliceColumns', async () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('pr-1334');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('testSheet');

      ws.addRow([
        'test1',
        'test2',
        'test3',
        'test4',
        'test5',
        'test6',
        'test7',
        'test8',
      ]);

      const row = ws.getRow(1);
      row.getCell(1).note = 'test1';
      row.getCell(2).note = 'test2';
      row.getCell(3).note = 'test3';
      row.getCell(4).note = 'test4';

      ws.spliceColumns(2, 1);

      expect(row.getCell(1).note).toBe('test1');
      expect(row.getCell(2).note).toBe('test3');
      expect(row.getCell(3).note).toBe('test4');
      expect(row.getCell(4).note).toBeUndefined();

      await wb.xlsx.writeFile(TEST_XLSX_FILE_NAME);
    });
  });

  // === PR 896 ===
  describe('pr 896 - leading/trailing whitespace preservation', () => {
    it('Should preserve leading and trailing whitespace', () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('pr-896');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('foo');
      ws.getCell('A1').value = ' leading';
      ws.getCell('A1').note = ' leading';
      ws.getCell('B1').value = 'trailing ';
      ws.getCell('B1').note = 'trailing ';
      ws.getCell('C1').value = ' both ';
      ws.getCell('C1').note = ' both ';
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('foo');
          expect(ws2.getCell('A1').value).toBe(' leading');
          expect(ws2.getCell('A1').note).toBe(' leading');
          expect(ws2.getCell('B1').value).toBe('trailing ');
          expect(ws2.getCell('B1').note).toBe('trailing ');
          expect(ws2.getCell('C1').value).toBe(' both ');
          expect(ws2.getCell('C1').note).toBe(' both ');
        });
    });

    it('Should preserve newlines', () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('pr-896');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('foo');
      ws.getCell('A1').value = 'Hello,\nWorld!';
      ws.getCell('A1').note = 'Later,\nAlligator!';
      ws.getCell('B1').value = ' Hello, \n World! ';
      ws.getCell('B1').note = ' Later, \n Alligator! ';
      return wb.xlsx
        .writeFile(TEST_XLSX_FILE_NAME)
        .then(() => {
          const wb2 = new ExcelJS.Workbook();
          return wb2.xlsx.readFile(TEST_XLSX_FILE_NAME);
        })
        .then(wb2 => {
          const ws2 = wb2.getWorksheet('foo');
          expect(ws2.getCell('A1').value).toBe('Hello,\nWorld!');
          expect(ws2.getCell('A1').note).toBe('Later,\nAlligator!');
          expect(ws2.getCell('B1').value).toBe(' Hello, \n World! ');
          expect(ws2.getCell('B1').note).toBe(' Later, \n Alligator! ');
        });
    });
  });

  // === PR 728 ===
  describe('pr 728 - Read worksheet hidden state', () => {
    it('pull request 728 - Read worksheet hidden state', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-pr-728.xlsx');
      const expected = {1: 'visible', 2: 'hidden', 3: 'visible'};
      wb.eachSheet((ws, sheetId) => {
        expect(ws.state).toBe(expected[sheetId]);
      });
    });
  });

  // === PR 1220 ===
  describe('pr 1220 - The worksheet should not be undefined', () => {
    it('pull request 1220 - The worksheet should not be undefined', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-pr-1220.xlsx');
      const ws = wb.getWorksheet(1);
      expect(ws).toBeDefined();
    });
  });

  // === PR 567 ===
  describe('pr 567 whole column defined names', () => {
    it('pull request 567 - read the file', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-pr-567.xlsx');
    });
  });

  // === PR 1576 ===
  describe('pr 1576 - inlineStr cell type support', () => {
    it('pull request 1576 - read inline string file', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/test-issue-1575.xlsx');
      const ws = wb.getWorksheet('Sheet1');
      expect(ws.getCell('A1').value).toBe('A');
      expect(ws.getCell('B1').value).toBe('B');
      expect(ws.getCell('C1').value).toBe('C');
      expect(ws.getCell('A2').value).toBe('1.0');
      expect(ws.getCell('B2').value).toBe('2.0');
      expect(ws.getCell('C2').value).toBe('3.0');
      expect(ws.getCell('A3').value).toBe('4.0');
      expect(ws.getCell('B3').value).toBe('5.0');
      expect(ws.getCell('C3').value).toBe('6.0');
    });
  });

  // === PR 1487 ===
  describe('pr 1487 - lastColumn with an empty column', () => {
    it('pull request 1487 - lastColumn with an empty column', async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile('./tests/integration/data/1904.xlsx');
      const ws = wb.getWorksheet('Sheet1');
      expect(ws.lastColumn).toBe(ws.getColumn(2));
    });
  });

  // === PR 1262 ===
  describe('pr 1262 - protect should work with streaming workbook writer', () => {
    it('pull request 1262 - protect should work with streaming workbook writer', async () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('pr-1262');
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        filename: TEST_XLSX_FILE_NAME,
      });

      const sheet = workbook.addWorksheet('data');
      const row = sheet.addRow(['readonly cell']);
      row.getCell(1).protection = {
        locked: true,
      };

      expect(sheet.protect).toBeDefined();

      sheet.protect('password', {
        spinCount: 1,
      });

      await workbook.commit();

      // read in file and ensure sheetProtection is there:
      const checkBook = new ExcelJS.Workbook();
      await checkBook.xlsx.readFile(TEST_XLSX_FILE_NAME);

      const checkSheet = checkBook.getWorksheet('data');
      expect(checkSheet.sheetProtection.spinCount).toBe(1);
    });
  });

  // === PR 1431 ===
  describe('pr 1431 - streaming reader should handle rich text within shared strings', () => {
    it('pull request 1431 - streaming reader should handle rich text within shared strings', async () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('pr-1431');
      const rowData = [
        {
          richText: [
            {font: {bold: true}, text: 'This should '},
            {font: {italic: true}, text: 'be one shared string value'},
          ],
        },
        'this should be the second shared string',
      ];

      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        filename: TEST_XLSX_FILE_NAME,
        useSharedStrings: true,
      });

      const sheet = workbook.addWorksheet('data');

      sheet.addRow(rowData);

      await workbook.commit();

      return new Promise((resolve, reject) => {
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
          TEST_XLSX_FILE_NAME,
          {
            entries: 'emit',
            hyperlinks: 'cache',
            sharedStrings: 'cache',
            styles: 'cache',
            worksheets: 'emit',
          }
        );

        workbookReader.on('worksheet', worksheet =>
          worksheet.on('row', row => {
            expect(row.values[1]).toEqual(rowData[0]);
            expect(row.values[2]).toBe(rowData[1]);

            resolve();
          })
        );
        workbookReader.on('error', reject);

        workbookReader.read();
      });
    });
  });

  // === PR 2244 ===
  describe('pr 2244 - Fix xlsx.writeFile() not catching error', () => {
    it('pull request 2244 - Fix xlsx.writeFile() not catching error when error occurs', async () => {
      const TEST_XLSX_FILE_NAME = testUtils.makeTempFileName('pr-2244');
      async function test() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('sheet');
        const imageId1 = workbook.addImage({
          filename: 'path/to/image.jpg', // Non-existent file
          extension: 'jpeg',
        });
        worksheet.addImage(imageId1, 'B2:D6');
        await workbook.xlsx.writeFile(TEST_XLSX_FILE_NAME);
      }
      let error;
      try {
        await test();
      } catch (err) {
        error = err;
      }
      expect(error).toBeInstanceOf(Error);
    });
  });
});
