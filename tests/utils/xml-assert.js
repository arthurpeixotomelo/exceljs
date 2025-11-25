import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  trimValues: true,
})

export function parseXml(xml) {
  return parser.parse(xml)
}

export function expectXmlEqual(actualXml, expectedXml) {
  const actual = parseXml(actualXml)
  const expected = parseXml(expectedXml)
  expect(actual).toEqual(expected)
}
