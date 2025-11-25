import { describe, it, expect } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import XmlStream from '../../../lib/utils/xml-stream.js';

describe('XmlStream', () => {
  const parser = new XMLParser({
    ignoreAttributes: false, 
    attributeNamePrefix: '@_',
    processEntities: true, 
    alwaysCreateTextNode: true, // Always create a text node property
    textNodeName: '#text', // Explicitly set the text node name
  });

  it('Writes simple XML doc', () => {
    const xmlStream = new XmlStream();

    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode('root', {
      attr1: 'attr1-value',
      attr2: 'attr2-value',
    });
    xmlStream.openNode('l1');
    xmlStream.openNode('l2');
    xmlStream.addAttribute('l2a1', 'v1');
    xmlStream.addAttribute('l2a2', 'v2');
    xmlStream.closeNode();
    xmlStream.closeNode();
    xmlStream.closeNode();

    const parsed = parser.parse(xmlStream.xml);
    expect(parsed.root).toBeDefined();
    expect(parsed.root.l1.l2).toBeDefined();
    expect(parsed.root.l1.l2['@_l2a1']).toBe('v1');
    expect(parsed.root.l1.l2['@_l2a2']).toBe('v2');
  });

  it('Writes text in XML doc', () => {
    const xmlStream = new XmlStream();

    xmlStream.openNode('root');
    xmlStream.openNode('l1');
    xmlStream.openNode('l2');
    xmlStream.addAttribute('l2a1', 'v1');
    xmlStream.writeText('Hello, World!');
    xmlStream.closeNode();
    xmlStream.openNode('l2');
    xmlStream.addAttribute('l2a1', 'v2');
    xmlStream.writeText('See ya later, Alligator!');
    xmlStream.closeNode();
    xmlStream.closeNode();
    xmlStream.closeNode();

    const parsed = parser.parse(xmlStream.xml);
    expect(parsed.root.l1.l2[0]['@_l2a1']).toBe('v1');
    expect(parsed.root.l1.l2[0]['#text']).toBe('Hello, World!');
    expect(parsed.root.l1.l2[1]['@_l2a1']).toBe('v2');
    expect(parsed.root.l1.l2[1]['#text']).toBe('See ya later, Alligator!');
  });

  it('text is escaped', () => {
    const xmlStream = new XmlStream();

    xmlStream.openNode('root');
    xmlStream.openNode('l1');
    xmlStream.writeText('<escape this!>');
    xmlStream.closeNode();
    xmlStream.closeNode();

    // Verify raw XML output
    expect(xmlStream.xml).toContain('&lt;escape this!&gt;');
  });

  it('attributes are escaped', () => {
    const xmlStream = new XmlStream();

    xmlStream.openNode('root');
    xmlStream.openNode('l1');
    xmlStream.addAttribute('stuff', 'this & that');
    xmlStream.openNode('l2', { foo: '<bar>' });
    xmlStream.closeNode();
    xmlStream.leafNode('l2', { quote: '"this"' });
    xmlStream.closeNode();
    xmlStream.closeNode();

    const parsed = parser.parse(xmlStream.xml);
    expect(parsed.root.l1['@_stuff']).toBe('this & that');
    expect(parsed.root.l1.l2[0]['@_foo']).toBe('<bar>');
    expect(parsed.root.l1.l2[1]['@_quote']).toBe('"this"');
  });

  it('rolls back', () => {
    const xmlStream = new XmlStream();

    xmlStream.openNode('root');
    xmlStream.addAttribute('in', '1');
    xmlStream.addRollback();
    xmlStream.addAttribute('not', '1');
    xmlStream.openNode('invalid');
    xmlStream.rollback();
    xmlStream.addAttribute('also', '2');
    xmlStream.openNode('valid');
    xmlStream.closeNode();
    xmlStream.closeNode();

    const parsed = parser.parse(xmlStream.xml);
    expect(parsed.root['@_in']).toBe('1');
    expect(parsed.root['@_also']).toBe('2');
    expect(parsed.root.valid).toBeDefined();
  });
});
