import tools from './tools.js';
import conditionalFormattingData from './data/conditional-formatting.json' with { type: 'json' };

const self = {
  conditionalFormattings: tools.fix(conditionalFormattingData),
  getConditionalFormatting(type) {
    return self.conditionalFormattings[type] || null;
  },
  addSheet(wb) {
    const ws = wb.addWorksheet('conditional-formatting');
    const {types} = self.conditionalFormattings;
    types.forEach(type => {
      const conditionalFormatting = self.getConditionalFormatting(type);
      if (conditionalFormatting) {
        ws.addConditionalFormatting(conditionalFormatting);
      }
    });
  },

  checkSheet(wb) {
    const ws = wb.getWorksheet('conditional-formatting');
    expect(ws).toBeDefined();
    expect(ws.conditionalFormattings).toBeDefined();
    (ws.conditionalFormattings && ws.conditionalFormattings).forEach(item => {
      const type = item.rules && item.rules[0].type;
      const conditionalFormatting = self.getConditionalFormatting(type);
      expect(item).toHaveProperty('ref');
      expect(item).toHaveProperty('rules');
      expect(self.conditionalFormattings[type]).toHaveProperty('ref');
      expect(self.conditionalFormattings[type]).toHaveProperty('rules');
      expect(item.ref).toEqual(conditionalFormatting.ref);
      expect(item.rules.length).toBe(conditionalFormatting.rules.length);
    });
  },
};

export default self;
