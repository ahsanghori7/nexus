import Config from './config';

describe('Config', () => {
  describe('hasHtmlCode', () => {
    it('should return true if text contains HTML code', () => {
      expect(Config.hasHtmlCode('{br}')).toBe(true);
      expect(Config.hasHtmlCode('{hr}')).toBe(true);
      expect(Config.hasHtmlCode('{b:')).toBe(true);
      expect(Config.hasHtmlCode('{u:')).toBe(true);
      expect(Config.hasHtmlCode('{mark:')).toBe(true);
      expect(Config.hasHtmlCode('{em:')).toBe(true);
      expect(Config.hasHtmlCode('{ul:')).toBe(true);
      expect(Config.hasHtmlCode('{li:')).toBe(true);
      expect(Config.hasHtmlCode('{ol:')).toBe(true);
    });

    it('should return false if text does not contain HTML code', () => {
      expect(Config.hasHtmlCode('no html')).toBe(false);
    });
  });

  describe('getJSONfromHTML', () => {
    it('should convert HTML to JSON-like string', () => {
      const html =
        '<p>test</p><br><hr><strong>bold</strong><u>underline</u><mark>mark</mark><em>emphasis</em><ul><li>item</li></ul><ol><li>item</li></ol><li class="ql-indent-1">indented</li>';
      const expected =
        'test{br}{hr}{b:bold}{u:underline}{mark:mark}{em:emphasis}{ul:{li:item}}{ol:{li:item}}{lind:indented}';
      expect(Config.getJSONfromHTML(html)).toBe(expected);
    });
  });

  describe('cleanHtml', () => {
    it('should clean HTML entities', () => {
      const html =
        '<span class="ql-cursor">&#x27;</span>&nbsp;&amp;&gt;&lt;&rdquo;&ldquo;';
      const expected = "' &><”“";
      expect(Config.cleanHtml(html)).toBe(expected);
    });
  });

  describe('getDocumentList', () => {
    it('should return a list of documents', () => {
      const folders = [
        {
          label: 'Folder 1',
          id: 1,
          files: [{ id: 1, name: 'File 1', visible: true }],
        },
      ];
      const result = Config.getDocumentList(folders);
      expect(result).toEqual([
        {
          name: 'view',
          type: 'row',
          props: { className: 'edit-document-table-row' },
          children: [
            {
              name: 'text',
              type: 'column',
              props: {
                className: 'edit-document-table-column',
              },
              children: ['File 1'],
            },
            {
              name: 'text',
              type: 'column',
              props: {
                className: 'edit-document-table-column',
              },
              children: ['Folder 1'],
            },
          ],
        },
      ]);
    });

    it('should filter documents by source and did', () => {
      const folders = [
        {
          label: 'Tender Addendum',
          id: 1,
          files: [{ id: 1, name: 'File 1', visible: true }],
        },
        {
          label: 'Folder 2',
          id: 2,
          files: [{ id: 2, name: 'File 2', visible: true }],
        },
      ];
      const result = Config.getDocumentList(folders, 'tenderAddendum', 1);
      expect(result).toEqual([
        {
          name: 'view',
          type: 'row',
          props: { className: 'edit-document-table-row' },
          children: [
            {
              name: 'text',
              type: 'column',
              props: {
                className: 'edit-document-table-column',
              },
              children: ['File 1'],
            },
            {
              name: 'text',
              type: 'column',
              props: {
                className: 'edit-document-table-column',
              },
              children: ['Tender Addendum'],
            },
          ],
        },
      ]);
    });
  });

  describe('createRow', () => {
    it('should create a row object', () => {
      const row = Config.createRow('col1', 'col2');
      expect(row).toEqual({
        name: 'view',
        type: 'row',
        props: { className: 'edit-document-table-row' },
        children: [
          {
            name: 'text',
            type: 'column',
            props: {
              className: 'edit-document-table-column',
            },
            children: ['col1'],
          },
          {
            name: 'text',
            type: 'column',
            props: {
              className: 'edit-document-table-column',
            },
            children: ['col2'],
          },
        ],
      });
    });
  });
});
