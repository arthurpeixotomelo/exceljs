// eslint-disable-next-line node/no-unsupported-features/node-builtins
const textEncoder = typeof TextEncoder === 'undefined' ? null : new TextEncoder('utf-8');
import {Buffer} from 'buffer';

export function stringToBuffer(str) {
  if (typeof str !== 'string') {
    return str;
  }
  if (textEncoder) {
    return Buffer.from(textEncoder.encode(str).buffer);
  }
  return Buffer.from(str);
}
