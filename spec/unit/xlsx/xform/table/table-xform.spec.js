import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname} from 'path';


import testXformHelper from '../test-xform-helper.js';

import TableXform from '../../../../../lib/xlsx/xform/table/table-xform.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const expectations = [
  {
    title: 'showing filter',
    create() {
      return new TableXform();
    },
    initialModel: null,
    preparedModel: require('./data/table.1.1'),
    xml: fs.readFileSync(join(__dirname, 'data/table.1.2.xml')).toString(),
    parsedModel: require('./data/table.1.3'),
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('TableXform', () => {
  testXformHelper(expectations);
});
