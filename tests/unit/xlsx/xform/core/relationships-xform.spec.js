import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';


import testXformHelper from '../test-xform-helper.js';

import RelationshipsXform from '../../../../../lib/xlsx/xform/core/relationships-xform.js';

import worksheetRels1 from './data/worksheet.rels.1.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const expectations = [
  {
    title: 'worksheet.rels',
    create() {
      return new RelationshipsXform();
    },
    preparedModel: worksheetRels1,
    xml: fs
      .readFileSync(join(__dirname, 'data/worksheet.rels.xml'))
      .toString()
      .replace(/\r\n/g, '\n'),
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('RelationshipsXform', () => {
  testXformHelper(expectations);
});
