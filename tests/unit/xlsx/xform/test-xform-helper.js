import { describe, it, expect } from 'vitest';
import { PassThrough } from 'stream';
import { XMLParser } from 'fast-xml-parser';
import underDash from '../../../utils/under-dash.js';
import CompyXform from './compy-xform.js';

import parseSax from '../../../../lib/utils/parse-sax.js';
import XmlStream from '../../../../lib/utils/xml-stream.js';
import BooleanXform from '../../../../lib/xlsx/xform/simple/boolean-xform.js';

const { cloneDeep, each } = underDash;
const parser = new XMLParser();

function getExpectation(expectation, name) {
  if (!expectation.hasOwnProperty(name)) {
    throw new Error(`Expectation missing required field: ${name}`);
  }
  return cloneDeep(expectation[name]);
}

// ===============================================================================================================
// provides boilerplate examples for the four transform steps: prepare, render,  parse and reconcile
//  prepare: model => preparedModel
//  render:  preparedModel => xml
//  parse:  xml => parsedModel
//  reconcile: parsedModel => reconciledModel

const its = {
  prepare(expectation) {
    it('Prepare Model', () => {
      const model = getExpectation(expectation, 'initialModel');
      const result = getExpectation(expectation, 'preparedModel');

      const xform = expectation.create();
      xform.prepare(model, expectation.options);
      expect(cloneDeep(model, false)).toEqual(result);
    });
  },

  render(expectation) {
    it('Render to XML', () => {
      const model = getExpectation(expectation, 'preparedModel');
      const result = getExpectation(expectation, 'xml');

      const xform = expectation.create();
      const xmlStream = new XmlStream();
      xform.render(xmlStream, model, 0);

      const parsed = parser.parse(xmlStream.xml);
      const expected = parser.parse(result);
      expect(parsed).toEqual(expected);
    });
  },

  'prepare-render': function (expectation) {
    it('Prepare and Render to XML', () => {
      const model = getExpectation(expectation, 'initialModel');
      const result = getExpectation(expectation, 'xml');

      const xform = expectation.create();
      const xmlStream = new XmlStream();

      xform.prepare(model, expectation.options);
      xform.render(xmlStream, model);

      const parsed = parser.parse(xmlStream.xml);
      const expected = parser.parse(result);
      expect(parsed).toEqual(expected);
    });
  },

  renderIn(expectation) {
    it('Render in Composite to XML ', () => {
      const model = {
        pre: true,
        child: getExpectation(expectation, 'preparedModel'),
        post: true,
      };
      const result = `<compy><pre/>${getExpectation(
        expectation,
        'xml'
      )}<post/></compy>`;

      const xform = new CompyXform({
        tag: 'compy',
        children: [
          {
            name: 'pre',
            xform: new BooleanXform({ tag: 'pre', attr: 'val' }),
          },
          { name: 'child', xform: expectation.create() },
          {
            name: 'post',
            xform: new BooleanXform({ tag: 'post', attr: 'val' }),
          },
        ],
      });

      const xmlStream = new XmlStream();
      xform.render(xmlStream, model);

      const parsed = parser.parse(xmlStream.xml);
      const expected = parser.parse(result);
      expect(parsed).toEqual(expected);
    });
  },

  parseIn(expectation) {
    it('Parse within composite', async () => {
      const xml = `<compy><pre/>${getExpectation(
        expectation,
        'xml'
      )}<post/></compy>`;
      const childXform = expectation.create();
      const result = { pre: true };
      result[childXform.tag] = getExpectation(expectation, 'parsedModel');
      result.post = true;
      const xform = new CompyXform({
        tag: 'compy',
        children: [
          {
            name: 'pre',
            xform: new BooleanXform({ tag: 'pre', attr: 'val' }),
          },
          { name: childXform.tag, xform: childXform },
          {
            name: 'post',
            xform: new BooleanXform({ tag: 'post', attr: 'val' }),
          },
        ],
      });
      const stream = new PassThrough();
      stream.write(xml);
      stream.end();
      const model = await xform.parse(parseSax(stream));

      const clone = cloneDeep(model, false);
      expect(clone).toEqual(result);
    });
  },

  parse(expectation) {
    it('Parse to Model', async () => {
      const xml = getExpectation(expectation, 'xml');
      const result = getExpectation(expectation, 'parsedModel');

      const xform = expectation.create();

      const stream = new PassThrough();
      stream.write(xml);
      stream.end();
      const model = await xform.parse(parseSax(stream));

      const clone = cloneDeep(model, false);
      expect(clone).toEqual(result);
    });
  },

  reconcile(expectation) {
    it('Reconcile Model', () => {
      const model = getExpectation(expectation, 'parsedModel');
      const result = getExpectation(expectation, 'reconciledModel');

      const xform = expectation.create();
      xform.reconcile(model, expectation.options);

      const clone = cloneDeep(model, false);
      expect(clone).toEqual(result);
    });
  },
};

function testXform(expectations) {
  each(expectations, (expectation) => {
    const tests = getExpectation(expectation, 'tests');
    describe(expectation.title, () => {
      each(tests, (test) => {
        its[test](expectation);
      });
    });
  });
}

export default testXform;
