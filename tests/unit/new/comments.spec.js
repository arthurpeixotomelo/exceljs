import { describe, it, expect } from 'vitest';
import ExcelJS from '../../../excel.js';

const { Workbook } = ExcelJS;

describe('Comments', () => {
  it('should add comments to cells', () => {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Test');

    ws.getCell('A1').comment = {
      texts: [
        { text: 'Hello' },
        { text: 'World', font: { italic: true } }
      ]
    };

    expect(ws.getCell('A1').comment.texts).toHaveLength(2);
    expect(ws.getCell('A1').comment.texts[0].text).toBe('Hello');
    expect(ws.getCell('A1').comment.texts[1].text).toBe('World');
    expect(ws.getCell('A1').comment.texts[1].font.italic).toBe(true);
  });

  it('should handle rich text comments', () => {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Test');

    ws.getCell('B1').comment = {
      texts: [
        {
          font: {
            size: 12,
            color: { theme: 0 },
            name: 'Calibri',
            family: 2,
            scheme: 'minor',
          },
          text: 'This is ',
        },
        {
          font: {
            italic: true,
            size: 12,
            color: { theme: 0 },
            name: 'Calibri',
            scheme: 'minor',
          },
          text: 'italic',
        },
      ],
    };

    const comment = ws.getCell('B1').comment;
    expect(comment.texts[0].text).toBe('This is ');
    expect(comment.texts[1].text).toBe('italic');
    expect(comment.texts[1].font.italic).toBe(true);
  });
});