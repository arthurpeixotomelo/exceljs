import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

import testXformHelper from '../test-xform-helper.js';

import WorkbookXform from '../../../../../lib/xlsx/xform/book/workbook-xform.js';

import book11 from './data/book.1.1.json' with { type: 'json' };
import book13 from './data/book.1.3.json' with { type: 'json' };
import book23 from './data/book.2.3.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const expectations = [
  {
    title: 'book.1',
    create() {
      return new WorkbookXform();
    },
    preparedModel: book11,
    xml: fs
      .readFileSync(join(__dirname, 'data/book.1.2.xml'))
      .toString()
      .replace(/\r\n/g, '\n'),
    parsedModel: book13,
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'book.2 - no properties',
    create() {
      return new WorkbookXform();
    },
    xml: fs
      .readFileSync(join(__dirname, 'data/book.2.2.xml'))
      .toString()
      .replace(/\r\n/g, '\n'),
    parsedModel: book23,
    tests: ['parse'],
  },
];

describe('WorkbookXform', () => {
  testXformHelper(expectations);
});
