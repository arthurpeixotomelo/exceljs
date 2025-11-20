import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import ExcelJS from '../../lib/exceljs.nodejs.js';
import StreamBuf from '../../lib/utils/stream-buf';
import { createReadStream, createWriteStream } from 'node:fs';

const DIRNAME = dirname(fileURLToPath(import.meta.url));

console.log('Copying bundle.js to public folder');
createReadStream(`${DIRNAME}/../../dist/exceljs.min.js`).pipe(
  createWriteStream(`${DIRNAME}/public/exceljs.min.js`)
);
createReadStream(`${DIRNAME}/../../dist/exceljs.js`).pipe(
  createWriteStream(`${DIRNAME}/public/exceljs.js`)
);

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const filePath = join(DIRNAME, 'public', 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    createReadStream(filePath).pipe(res);
  } else if (req.method === 'POST' && req.url === '/api/upload') {
    const wb = new ExcelJS.Workbook();

    const stream = new StreamBuf();
    stream.on('finish', () => {
      const base64 = stream.read();

      wb.xlsx.load(base64, { base64: true }).then(() => {
        const ws = wb.getWorksheet('blort');

        console.log('XLSX uploaded:');
        console.log('A1', ws.getCell('A1').value);
        console.log('A2', ws.getCell('A2').value);

        ws.getCell('A1').value = 'Hey Ho!';
        ws.getCell('A2').value = 14;

        const outStream = new StreamBuf();
        wb.xlsx.write(outStream).then(() => {
          const b = outStream.read();
          const s = b.toString('base64');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: s }));
        });
      });
    });

    req.pipe(stream);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3003, () => {
  console.log('Listening on port 3003');
});
