import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname} from 'path';


import testXformHelper from '../test-xform-helper.js';

import DrawingXform from '../../../../../lib/xlsx/xform/drawing/drawing-xform.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  rels: {
    rId1: {Target: '../media/image1.jpg'},
    rId2: {Target: '../media/image2.jpg'},
  },
  mediaIndex: {image1: 0, image2: 1},
  media: [{}, {}],
};

const expectations = [
  {
    title: 'Drawing 1',
    create() {
      return new DrawingXform({tag: 'xdr:from'});
    },
    initialModel: require('./data/drawing.1.0.js'),
    preparedModel: require('./data/drawing.1.1.js'),
    xml: fs.readFileSync(join(__dirname, 'data/drawing.1.2.xml')).toString(),
    parsedModel: require('./data/drawing.1.3.js'),
    reconciledModel: require('./data/drawing.1.4.js'),
    tests: ['prepare', 'render', 'renderIn', 'parse', 'reconcile'],
    options,
  },
];

describe('DrawingXform', () => {
  testXformHelper(expectations);
});
