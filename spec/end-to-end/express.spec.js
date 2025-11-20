import Excel from '../../excel.js';
import { PassThrough } from 'stream';
import testutils from '../utils/index.js';
import { createServer, request } from 'http';

describe('HTTP API', () => {
  let server;
  before(() => {
    server = createServer((req, res) => {
      if (req.url === '/workbook') {
        const wb = testutils.createTestBook(new Excel.Workbook(), 'xlsx');
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename=Report.xlsx');
        wb.xlsx.write(res).then(() => {
          res.end();
        });
      } else {
        res.statusCode = 404;
        res.end();
      }
    }).listen(3003);
  });

  after(() => {
    server.close();
  });

  it('downloads a workbook', async function() {
    this.timeout(5000);

    const options = {
      hostname: '127.0.0.1',
      port: 3003,
      path: '/workbook',
      method: 'GET',
      headers: {
        'Accept': '*/*'
      }
    };

    const wb2 = new Excel.Workbook();

    await new Promise((resolve, reject) => {
      const req = request(options, res => {
        if (res.statusCode !== 200) {
          reject(new Error(`Request failed with status code ${res.statusCode}`));
          return;
        }

        // Pipe response to workbook
        res.pipe(new PassThrough()).on('error', reject);
        wb2.xlsx.read(res.pipe(new PassThrough())).then(resolve).catch(reject);
      });

      req.on('error', reject);
      req.end();
    });

    testutils.checkTestBook(wb2, 'xlsx');
  });
});
