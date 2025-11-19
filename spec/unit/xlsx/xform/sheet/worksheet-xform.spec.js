import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname} from 'path';


import testXformHelper from '../test-xform-helper.js';

import * as Enums from '../../../../../lib/doc/enums.js';
import XmlStream from '../../../../../lib/utils/xml-stream.js';
import WorksheetXform from '../../../../../lib/xlsx/xform/sheet/worksheet-xform.js';

import SharedStringsXform from '../../../../../lib/xlsx/xform/strings/shared-strings-xform.js';
import StylesXform from '../../../../../lib/xlsx/xform/style/styles-xform.js';

import sheet_1_0 from './data/sheet.1.0.json' with { type: 'json' };
import sheet_1_1 from './data/sheet.1.1.json' with { type: 'json' };
import sheet_1_3 from './data/sheet.1.3.json' with { type: 'json' };
import sheet_1_4 from './data/sheet.1.4.json' with { type: 'json' };
import sheet_2_0 from './data/sheet.2.0.json' with { type: 'json' };
import sheet_2_1 from './data/sheet.2.1.json' with { type: 'json' };
import sheet_3_1 from './data/sheet.3.1.json' with { type: 'json' };
import sheet_5_0 from './data/sheet.5.0.json' with { type: 'json' };
import sheet_5_1 from './data/sheet.5.1.json' with { type: 'json' };
import sheet_5_3 from './data/sheet.5.3.json' with { type: 'json' };
import sheet_5_4 from './data/sheet.5.4.json' with { type: 'json' };
import sheet_6_1 from './data/sheet.6.1.json' with { type: 'json' };
import sheet_6_3 from './data/sheet.6.3.json' with { type: 'json' };
import sheet_7_0 from './data/sheet.7.0.json' with { type: 'json' };
import sheet_7_1 from './data/sheet.7.1.json' with { type: 'json' };
import sheet_4_0 from './data/sheet.4.0.json' with { type: 'json' };
import sheet_4_0 from './data/sheet.4.0.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fakeStyles = {
  addStyleModel(style, cellType) {
    if (cellType === Enums.ValueType.Date) {
      return 1;
    }
    if (style && style.font) {
      return 2;
    }
    return 0;
  },
  getStyleModel(id) {
    switch (id) {
      case 1:
        return {numFmt: 'mm-dd-yy'};
      case 2:
        return {
          font: {
            underline: true,
            size: 11,
            color: {theme: 10},
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
        };
      default:
        return null;
    }
  },
};

const fakeHyperlinkMap = {
  B6: 'https://www.npmjs.com/package/exceljs',
};

function fixDate(model) {
  model.rows[3].cells[1].value = new Date(model.rows[3].cells[1].value);
  return model;
}

const expectations = [
  {
    title: 'Sheet 1',
    create: () => new WorksheetXform(),
    initialModel: fixDate(sheet_1_0),
    preparedModel: fixDate(sheet_1_1),
    xml: fs.readFileSync(join(__dirname, 'data/sheet.1.2.xml')).toString(),
    parsedModel: sheet_1_3,
    reconciledModel: fixDate(sheet_1_4),
    tests: ['prepare', 'render', 'parse'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 2 - Data Validations',
    create: () => new WorksheetXform(),
    initialModel: sheet_2_0,
    preparedModel: sheet_2_1,
    xml: fs.readFileSync(join(__dirname, 'data/sheet.2.2.xml')).toString(),
    tests: ['prepare', 'render'],
    options: {
      styles: new StylesXform(true),
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 3 - Empty Sheet',
    create: () => new WorksheetXform(),
    preparedModel: sheet_3_1,
    xml: fs.readFileSync(join(__dirname, 'data/sheet.3.2.xml')).toString(),
    tests: ['render'],
    options: {
      styles: new StylesXform(true),
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
    },
  },
  {
    title: 'Sheet 5 - Shared Formulas',
    create: () => new WorksheetXform(),
    initialModel: sheet_5_0,
    preparedModel: sheet_5_1,
    xml: fs.readFileSync(join(__dirname, 'data/sheet.5.2.xml')).toString(),
    parsedModel: sheet_5_3,
    reconciledModel: sheet_5_4,
    tests: ['prepare-render', 'parse'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 6 - AutoFilter',
    create: () => new WorksheetXform(),
    preparedModel: sheet_6_1,
    xml: fs.readFileSync(join(__dirname, 'data/sheet.6.2.xml')).toString(),
    parsedModel: sheet_6_3,
    tests: ['render', 'parse'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
  {
    title: 'Sheet 7 - Row Breaks',
    create: () => new WorksheetXform(),
    initialModel: sheet_7_0,
    preparedModel: sheet_7_1,
    xml: fs.readFileSync(join(__dirname, 'data/sheet.7.2.xml')).toString(),
    tests: ['prepare', 'render'],
    options: {
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
      hyperlinkMap: fakeHyperlinkMap,
      styles: fakeStyles,
      formulae: {},
      siFormulae: 0,
    },
  },
];

describe('WorksheetXform', () => {
  testXformHelper(expectations);

  it('hyperlinks must be after dataValidations', () => {
    const xform = new WorksheetXform();
    const model = sheet_4_0;
    const xmlStream = new XmlStream();
    const options = {
      styles: new StylesXform(true),
      sharedStrings: new SharedStringsXform(),
      hyperlinks: [],
    };
    xform.prepare(model, options);
    xform.render(xmlStream, model);

    const {xml} = xmlStream;
    const iHyperlinks = xml.indexOf('hyperlinks');
    const iDataValidations = xml.indexOf('dataValidations');
    expect(iHyperlinks).not.to.equal(-1);
    expect(iDataValidations).not.to.equal(-1);
    expect(iHyperlinks).to.be.greaterThan(iDataValidations);
  });

  it('conditionalFormattings must be before dataValidations', () => {
    const xform = new WorksheetXform();
    const model = sheet_4_0;
    const xmlStream = new XmlStream();
    const options = {
      styles: new StylesXform(true),
      hyperlinks: [],
    };
    xform.prepare(model, options);
    xform.render(xmlStream, model);

    const {xml} = xmlStream;
    const iConditionalFormatting = xml.indexOf('conditionalFormatting');
    const iDataValidations = xml.indexOf('dataValidations');
    expect(iConditionalFormatting).not.to.equal(-1);
    expect(iDataValidations).not.to.equal(-1);
    expect(iConditionalFormatting).to.be.lessThan(iDataValidations);
  });
});
