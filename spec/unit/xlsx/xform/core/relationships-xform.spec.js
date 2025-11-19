import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname} from 'path';


import testXformHelper from '../test-xform-helper.js';

import RelationshipsXform from '../../../../../lib/xlsx/xform/core/relationships-xform.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const expectations = [
  {
    title: 'worksheet.rels',
    create() {
      return new RelationshipsXform();
    },
    preparedModel: require('./data/worksheet.rels.1.json'),
    xml: fs
      .readFileSync(`${__dirname}/data/worksheet.rels.xml`)
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
