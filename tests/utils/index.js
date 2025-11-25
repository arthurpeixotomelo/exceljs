import _ from './under-dash.js';
import tools from './tools.js';
import { readFileSync, existsSync, mkdirSync } from 'fs';

import testWorkbookReader from './test-workbook-reader.js';
import testDataValidationSheet from './test-data-validation-sheet.js';
import testConditionalFormattingSheet from './test-conditional-formatting-sheet.js';
import testValuesSheet from './test-values-sheet.js';
import testSplicedSheet from './test-spliced-sheet.js';

import Row from '../../lib/doc/row.js';
import Column from '../../lib/doc/column.js';

const viewsData = JSON.parse(readFileSync(new URL('./data/views.json', import.meta.url)));
const sheetValuesData = JSON.parse(readFileSync(new URL('./data/sheet-values.json', import.meta.url)));
const stylesData = JSON.parse(readFileSync(new URL('./data/styles.json', import.meta.url)));
const sheetPropertiesData = JSON.parse(readFileSync(new URL('./data/sheet-properties.json', import.meta.url)));
const pageSetupData = JSON.parse(readFileSync(new URL('./data/page-setup.json', import.meta.url)));
const conditionalFormattingData = JSON.parse(readFileSync(new URL('./data/conditional-formatting.json', import.meta.url)));
const headerFooterData = JSON.parse(readFileSync(new URL('./data/header-footer.json', import.meta.url)));

const testSheets = {
  dataValidations: testDataValidationSheet,
  conditionalFormatting: testConditionalFormattingSheet,
  values: testValuesSheet,
  splice: testSplicedSheet,
};

function getOptions(docType, options) {
  let result;
  switch (docType) {
    case 'xlsx':
      result = {
        sheetName: 'values',
        checkFormulas: true,
        checkMerges: true,
        checkStyles: true,
        checkBadAlignments: true,
        checkSheetProperties: true,
        dateAccuracy: 3,
        checkViews: true,
      };
      break;
    case 'csv':
      result = {
        sheetName: 'sheet1',
        checkFormulas: false,
        checkMerges: false,
        checkStyles: false,
        checkBadAlignments: false,
        checkSheetProperties: false,
        dateAccuracy: 1000,
        checkViews: false,
      };
      break;
    default:
      throw new Error(`Bad doc-type: ${docType}`);
  }
  return Object.assign(result, options);
}

export default {
  views: tools.fix(viewsData),
  testValues: tools.fix(sheetValuesData),
  styles: tools.fix(stylesData),
  properties: tools.fix(sheetPropertiesData),
  pageSetup: tools.fix(pageSetupData),
  conditionalFormatting: tools.fix(conditionalFormattingData),
  headerFooter: tools.fix(headerFooterData),

  createTestBook(workbook, docType, sheets) {
    const options = getOptions(docType);
    sheets = sheets || ['values'];

    workbook.views = [
      {x: 1, y: 2, width: 10000, height: 20000, firstSheet: 0, activeTab: 0},
    ];

    sheets.forEach(sheet => {
      const testSheet = _.get(testSheets, sheet);
      testSheet.addSheet(workbook, options);
    });

    return workbook;
  },

  checkTestBook(workbook, docType, sheets, options) {
    options = getOptions(docType, options);
    sheets = sheets || ['values'];

    expect(workbook).toBeDefined();

    if (options.checkViews) {
      expect(workbook.views).to.deep.equal([
        {
          x: 1,
          y: 2,
          width: 10000,
          height: 20000,
          firstSheet: 0,
          activeTab: 0,
          visibility: 'visible',
        },
      ]);
    }

    sheets.forEach(sheet => {
      const testSheet = _.get(testSheets, sheet);
      testSheet.checkSheet(workbook, options);
    });
  },

  checkTestBookReader: testWorkbookReader.checkBook,

  createSheetMock() {
    return {
      _keys: {},
      _cells: {},
      rows: [],
      columns: [],
      properties: {
        outlineLevelCol: 0,
        outlineLevelRow: 0,
      },

      addColumn(colNumber, defn) {
        const newColumn = new Column(this, colNumber, defn);
        this.columns[colNumber - 1] = newColumn;
        return newColumn;
      },
      getColumn(colNumber) {
        let column = this.columns[colNumber - 1] || this._keys[colNumber];
        if (!column) {
          column = this.columns[colNumber - 1] = new Column(this, colNumber);
        }
        return column;
      },
      getRow(rowNumber) {
        let row = this.rows[rowNumber - 1];
        if (!row) {
          row = this.rows[rowNumber - 1] = new Row(this, rowNumber);
        }
        return row;
      },
      getCell(rowNumber, colNumber) {
        return this.getRow(rowNumber).getCell(colNumber);
      },
      getColumnKey(key) {
        return this._keys[key];
      },
      setColumnKey(key, value) {
        this._keys[key] = value;
      },
      deleteColumnKey(key) {
        delete this._keys[key];
      },
      eachColumnKey(f) {
        _.each(this._keys, f);
      },
      eachRow(opt, f) {
        if (!f) {
          f = opt;
          opt = {};
        }
        if (opt && opt.includeEmpty) {
          const n = this.rows.length;
          for (let i = 1; i <= n; i++) {
            f(this.getRow(i), i);
          }
        } else {
          this.rows.forEach((r, i) => {
            if (r) {
              f(r, i + 1);
            }
          });
        }
      },
    };
  },
  makeTempFileName(basename = 'wb.test', ext = 'xlsx') {
    // ensure out directory exists
    const outDirRelative = './tests/out';
    try {
      if (!existsSync(outDirRelative)) mkdirSync(outDirRelative, {recursive: true});
    } catch (err) {
      // ignore: the test runner should have the directory already
    }
    const unique = `${basename}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
    return `${outDirRelative}/${unique}.${ext}`;
  },
};
