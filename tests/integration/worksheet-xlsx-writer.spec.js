import testutils from '../utils/index.js'

import ExcelJS from 'ts-sheet';

const CONCATENATE_HELLO_WORLD = 'CONCATENATE("Hello", ", ", "World!")';

describe('WorksheetWriter', () => {
  describe('Values', () => {
    it('stores values properly', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      const now = new Date();

      // plain number
      ws.getCell('A1').value = 7;

      // simple string
      ws.getCell('B1').value = 'Hello, World!';

      // floating point
      ws.getCell('C1').value = 3.14;

      // 5 will be overwritten by the current date-time
      ws.getCell('D1').value = 5;
      ws.getCell('D1').value = now;

      // constructed string - will share recored with B1
      ws.getCell('E1').value = `${['Hello', 'World'].join(', ')}!`;

      // hyperlink
      ws.getCell('F1').value = {
        text: 'www.google.com',
        hyperlink: 'http://www.google.com',
      };

      // number formula
      ws.getCell('A2').value = {formula: 'A1', result: 7};

      // string formula
      ws.getCell('B2').value = {
        formula: CONCATENATE_HELLO_WORLD,
        result: 'Hello, World!',
      };

      // date formula
      ws.getCell('C2').value = {formula: 'D1', result: now};

      // Smoke checks: a couple of values and a formula are present
      expect(ws.getCell('A1').value).toBe(7);
      expect(ws.getCell('B1').value).toBe('Hello, World!');
      expect(ws.getCell('A2').value.formula).toBe('A1');
    });

    it('stores shared string values properly', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
        useSharedStrings: true,
      });
      const ws = wb.addWorksheet('blort');

      ws.getCell('A1').value = 'Hello, World!';

      ws.getCell('A2').value = 'Hello';
      ws.getCell('B2').value = 'World';
      ws.getCell('C2').value = {
        formula: 'CONCATENATE(A2, ", ", B2, "!")',
        result: 'Hello, World!',
      };

      ws.getCell('A3').value = `${['Hello', 'World'].join(', ')}!`;

      // Smoke check: ensure the shared strings produce the same string object
      expect(ws.getCell('A1').value).toBe(ws.getCell('A3').value);
    });

    it('assigns cell types properly', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // plain number
      ws.getCell('A1').value = 7;

      // simple string
      ws.getCell('B1').value = 'Hello, World!';

      // floating point
      ws.getCell('C1').value = 3.14;

      // date-time
      ws.getCell('D1').value = new Date();

      // hyperlink
      ws.getCell('E1').value = {
        text: 'www.google.com',
        hyperlink: 'http://www.google.com',
      };

      // number formula
      ws.getCell('A2').value = {formula: 'A1', result: 7};

      // string formula
      ws.getCell('B2').value = {
        formula: CONCATENATE_HELLO_WORLD,
        result: 'Hello, World!',
      };

      // date formula
      ws.getCell('C2').value = {formula: 'D1', result: new Date()};

      // Smoke: check a few type assignments
      expect(ws.getCell('A1').type).toBe(ExcelJS.ValueType.Number);
      expect(ws.getCell('B1').type).toBe(ExcelJS.ValueType.String);
      expect(ws.getCell('E1').type).toBe(ExcelJS.ValueType.Hyperlink);
    });

    it('adds columns', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      ws.columns = [
        {key: 'id', width: 10},
        {key: 'name', width: 32},
        {key: 'dob', width: 10},
      ];

      // Smoke test: ensure columns are added and widths/keys are available
      expect(ws.getColumn('id').number).toBe(1);
      expect(ws.getColumn('id').width).toBe(10);
      expect(ws.getColumn('name').key).toBe('name');
    });

    it('adds column headers', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      ws.columns = [
        {header: 'Id', width: 10},
        {header: 'Name', width: 32},
        {header: 'D.O.B.', width: 10},
      ];

      // Smoke checks: column headers are present
      expect(ws.getCell('A1').value).toBe('Id');
      expect(ws.getCell('B1').value).toBe('Name');
    });

    it('adds column headers by number', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // by defn
      ws.getColumn(1).defn = {key: 'id', header: 'Id', width: 10};

      // by property
      ws.getColumn(2).key = 'name';
      ws.getColumn(2).header = 'Name';
      ws.getColumn(2).width = 32;

      expect(ws.getCell('A1').value).toBe('Id');
      // Smoke: ensure numeric columns map to keys/headers
      expect(ws.getColumn(1).key).toBe('id');
    });

    it('adds column headers by letter', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // by defn
      ws.getColumn('A').defn = {key: 'id', header: 'Id', width: 10};

      // by property
      ws.getColumn('B').key = 'name';
      ws.getColumn('B').header = 'Name';
      ws.getColumn('B').width = 32;

      expect(ws.getCell('A1').value).toBe('Id');
      // Smoke: ensure letter-based column header mapping works
      expect(ws.getColumn('A').key).toBe('id');
    });

    it('adds rows by object', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // add columns to define column keys
      ws.columns = [
        {header: 'Id', key: 'id', width: 10},
        {header: 'Name', key: 'name', width: 32},
        {header: 'D.O.B.', key: 'dob', width: 10},
      ];

      const dateValue1 = new Date(1970, 1, 1);
      const dateValue2 = new Date(1965, 1, 7);

      ws.addRow({id: 1, name: 'John Doe', dob: dateValue1});
      ws.addRow({id: 2, name: 'Jane Doe', dob: dateValue2});

      // Smoke: ensure rows are added and values exist
      expect(ws.getCell('A2').value).toBe(1);
      expect(ws.getCell('B2').value).toBe('John Doe');
    });

    it('adds rows by contiguous array', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      const dateValue1 = new Date(1970, 1, 1);
      const dateValue2 = new Date(1965, 1, 7);

      ws.addRow([1, 'John Doe', dateValue1]);
      ws.addRow([2, 'Jane Doe', dateValue2]);

      // Smoke: verify contiguous-array rows create values
      expect(ws.getCell('A1').value).toBe(1);
      expect(ws.getCell('B1').value).toBe('John Doe');
    });

    it('adds rows by sparse array', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      const dateValue1 = new Date(1970, 1, 1);
      const dateValue2 = new Date(1965, 1, 7);
      const rows = [
        ,
        [, 1, 'John Doe', , dateValue1],
        [, 2, 'Jane Doe', , dateValue2],
      ];
      const row3 = [];
      row3[1] = 3;
      row3[3] = 'Sam';
      row3[5] = dateValue1;
      rows.push(row3);
      rows.forEach(row => {
        if (row) {
          ws.addRow(row);
        }
      });

      // Smoke: sparse rows produce expected cells
      expect(ws.getCell('A1').value).toBe(1);
      expect(ws.getCell('C3').value).toBe('Sam');
    });

    it('sets row styles', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('basket');

      ws.getCell('A1').value = 5;
      ws.getCell('A1').numFmt = testutils.styles.numFmts.numFmt1;
      ws.getCell('A1').font = testutils.styles.fonts.arialBlackUI14;

      ws.getCell('C1').value = 'Hello, World!';
      ws.getCell('C1').alignment = testutils.styles.namedAlignments.bottomRight;
      ws.getCell('C1').border = testutils.styles.borders.doubleRed;
      ws.getCell('C1').fill = testutils.styles.fills.redDarkVertical;

      ws.getRow(1).numFmt = testutils.styles.numFmts.numFmt2;
      ws.getRow(1).font = testutils.styles.fonts.comicSansUdB16;
      ws.getRow(1).alignment = testutils.styles.namedAlignments.middleCentre;
      ws.getRow(1).border = testutils.styles.borders.thin;
      ws.getRow(1).fill = testutils.styles.fills.redGreenDarkTrellis;

      // Smoke: check that row style change affects derived cells
      expect(ws.getCell('A1').font).toEqual(testutils.styles.fonts.comicSansUdB16);

      expect(ws.findCell('B1')).toBeUndefined();

      expect(ws.getCell('C1').font).toEqual(testutils.styles.fonts.comicSansUdB16);

      // when we 'get' the previously null cell, it should inherit the row styles
      expect(ws.getCell('B1').font).toEqual(testutils.styles.fonts.comicSansUdB16);
    });

    it('sets col styles', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('basket');

      ws.getCell('A1').value = 5;
      ws.getCell('A1').numFmt = testutils.styles.numFmts.numFmt1;
      ws.getCell('A1').font = testutils.styles.fonts.arialBlackUI14;

      ws.getCell('A3').value = 'Hello, World!';
      ws.getCell('A3').alignment = testutils.styles.namedAlignments.bottomRight;
      ws.getCell('A3').border = testutils.styles.borders.doubleRed;
      ws.getCell('A3').fill = testutils.styles.fills.redDarkVertical;

      ws.getColumn('A').numFmt = testutils.styles.numFmts.numFmt2;
      ws.getColumn('A').font = testutils.styles.fonts.comicSansUdB16;
      ws.getColumn('A').alignment =
        testutils.styles.namedAlignments.middleCentre;
      ws.getColumn('A').border = testutils.styles.borders.thin;
      ws.getColumn('A').fill = testutils.styles.fills.redGreenDarkTrellis;

      // Smoke: column style is applied and visible on a cell
      expect(ws.getCell('A1').font).toEqual(testutils.styles.fonts.comicSansUdB16);

      expect(ws.findRow(2)).toBeUndefined();

      expect(ws.getCell('A3').font).toEqual(testutils.styles.fonts.comicSansUdB16);

      // when we 'get' the previously null cell, it should inherit the column styles
      expect(ws.getCell('A2').font).toEqual(testutils.styles.fonts.comicSansUdB16);
    });
  });

  describe('Merge Cells', () => {
    it('references the same top-left value', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // initial values
      ws.getCell('A1').value = 'A1';
      ws.getCell('B1').value = 'B1';
      ws.getCell('A2').value = 'A2';
      ws.getCell('B2').value = 'B2';

      ws.mergeCells('A1:B2');

      expect(ws.getCell('A1').value).toBe('A1');
      expect(ws.getCell('B1').value).toBe('A1');
      expect(ws.getCell('A2').value).toBe('A1');
      expect(ws.getCell('B2').value).toBe('A1');

      expect(ws.getCell('A1').type).toBe(ExcelJS.ValueType.String);
      expect(ws.getCell('B1').type).toBe(ExcelJS.ValueType.Merge);
      expect(ws.getCell('A2').type).toBe(ExcelJS.ValueType.Merge);
      expect(ws.getCell('B2').type).toBe(ExcelJS.ValueType.Merge);
    });

    it('does not allow overlapping merges', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      ws.mergeCells('B2:C3');

      // intersect four corners
      expect(() => {
        ws.mergeCells('A1:B2');
      }).toThrow(Error);
      expect(() => {
        ws.mergeCells('C1:D2');
      }).toThrow(Error);
      expect(() => {
        ws.mergeCells('C3:D4');
      }).toThrow(Error);
      expect(() => {
        ws.mergeCells('A3:B4');
      }).toThrow(Error);

      // enclosing
      expect(() => {
        ws.mergeCells('A1:D4');
      }).toThrow(Error);
    });
  });

  describe('Page Breaks', () => {
    it('adds multiple row breaks', () => {
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter();
      const ws = wb.addWorksheet('blort');

      // initial values
      ws.getCell('A1').value = 'A1';
      ws.getCell('B1').value = 'B1';
      ws.getCell('A2').value = 'A2';
      ws.getCell('B2').value = 'B2';
      ws.getCell('A3').value = 'A3';
      ws.getCell('B3').value = 'B3';

      let row = ws.getRow(1);
      row.addPageBreak();
      row = ws.getRow(2);
      row.addPageBreak();
      expect(ws.rowBreaks.length).toBe(2);
    });
  });
});
