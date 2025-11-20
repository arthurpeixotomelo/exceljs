import Workbook from './doc/workbook.js';
import ModelContainer from './doc/modelcontainer.js';
import WorkbookWriter from './stream/xlsx/workbook-writer.js';
import WorkbookReader from './stream/xlsx/workbook-reader.js';
import * as Enums from './doc/enums.js';

const ExcelJS = {
  Workbook,
  ModelContainer,
  stream: {
    xlsx: {
      WorkbookWriter,
      WorkbookReader,
    },
  },
  ...Enums,
};

export default ExcelJS;