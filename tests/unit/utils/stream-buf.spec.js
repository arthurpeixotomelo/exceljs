import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import StreamBuf from '../../../lib/utils/stream-buf.js';
import StringBuf from '../../../lib/utils/string-buf.js';

describe('StreamBuf', () => {
  // StreamBuf is designed as a general-purpose writable-readable stream
  // However its use in ExcelJS is primarily as a memory buffer between
  // the streaming writers and the archive, hence the tests here will
  // focus just on that.
  it('writes strings as UTF8', () => {
    const stream = new StreamBuf();
    stream.write('Hello, World!');
    const chunk = stream.read();
    expect(chunk).toBeInstanceOf(Buffer);
    expect(chunk.toString('UTF8')).toBe('Hello, World!');
  });

  it('writes StringBuf chunks', () => {
    const stream = new StreamBuf();
    const strBuf = new StringBuf({ size: 64 });
    strBuf.addText('Hello, World!');
    stream.write(strBuf);
    const chunk = stream.read();
    expect(chunk).toBeInstanceOf(Buffer);
    expect(chunk.toString('UTF8')).toBe('Hello, World!');
  });

  it('signals end', () =>
    new Promise(resolve => {
      const stream = new StreamBuf();
      stream.on('finish', resolve);
      stream.write('Hello, World!');
      stream.end();
    }));

  it('handles buffers', () =>
    new Promise((resolve, reject) => {
      const s = fs.createReadStream(path.join(__dirname, 'data/image1.png'));
      const sb = new StreamBuf();
      sb.on('finish', () => {
        const buf = sb.toBuffer();
        expect(buf.length).toBe(1672);
        resolve();
      });
      sb.on('error', reject);
      s.pipe(sb);
    }));

  it('handle unsupported type of chunk', async () => {
    const stream = new StreamBuf();
    await expect(async () => {
      await stream.write({});
    }).rejects.toThrow('Chunk must be one of type String, Buffer or StringBuf.');
  });
});
