import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';


import testXformHelper from '../test-xform-helper.js';

import SharedStringsXform from '../../../../../lib/xlsx/xform/strings/shared-strings-xform.js';

import sharedStrings from './data/sharedStrings.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const expectations = [
  {
    title: 'Shared Strings',
    create() {
      return new SharedStringsXform();
    },
    preparedModel: sharedStrings,
    xml: fs.readFileSync(join(__dirname, 'data/sharedStrings.xml')).toString(),
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('SharedStringsXform', () => {
  testXformHelper(expectations);
});
