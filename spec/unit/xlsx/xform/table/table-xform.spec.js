import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';


import testXformHelper from '../test-xform-helper.js';

import TableXform from '../../../../../lib/xlsx/xform/table/table-xform.js';

import table11 from './data/table.1.1.json' with { type: 'json' };
import table13 from './data/table.1.3.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const expectations = [
  {
    title: 'showing filter',
    create() {
      return new TableXform();
    },
    initialModel: null,
    preparedModel: table11,
    xml: fs.readFileSync(join(__dirname, 'data/table.1.2.xml')).toString(),
    parsedModel: table13,
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('TableXform', () => {
  testXformHelper(expectations);
});
