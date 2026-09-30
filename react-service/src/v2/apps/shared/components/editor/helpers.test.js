import { htmlToDelta, parseHtmlToDelta } from './helpers';

// Mock Quill since it's used internally
jest.mock('quill', () => {
  const mockDelta = jest.fn(() => {
    const instance = {
      ops: [],
      insert: jest.fn((value, attributes) => {
        instance.ops.push({ insert: value, attributes });
        return instance;
      }),
      retain: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };
    return instance;
  });

  return {
    import: jest.fn((module) => {
      if (module === 'delta') {
        return mockDelta;
      }
      return jest.fn();
    }),
  };
});

const createClassList = (classes = []) => ({
  contains: (className) => classes.includes(className),
  [Symbol.iterator]: function* iterator() {
    yield* classes;
  },
});

const createTextNode = (text) => ({
  nodeType: Node.TEXT_NODE,
  nodeName: '#text',
  textContent: text,
});

const createElementNode = (
  name,
  {
    classes = [],
    style = {},
    attributes = {},
    childNodes = [],
  } = {},
) => ({
  nodeType: Node.ELEMENT_NODE,
  nodeName: name.toUpperCase(),
  classList: createClassList(classes),
  style,
  childNodes,
  getAttribute: (attr) => attributes[attr],
  textContent: childNodes
    .map((child) => child.textContent || '')
    .join(''),
});

const originalDOMParser = global.DOMParser;
const originalDocument = global.document;

describe('Editor Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('htmlToDelta', () => {
    it('returns a delta object when called', () => {
      const html = '<p>Simple text</p>';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('handles empty string input', () => {
      const html = '';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('throws error on null input', () => {
      const html = null;
      expect(() => htmlToDelta(html)).toThrow();
    });

    it('throws error on undefined input', () => {
      const html = undefined;
      expect(() => htmlToDelta(html)).toThrow();
    });

    it('processes ordered list HTML', () => {
      const html = '<ol><li>First item</li><li>Second item</li></ol>';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('processes unordered list HTML', () => {
      const html = '<ul><li>First item</li><li>Second item</li></ul>';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with indented list items', () => {
      const html = '<ol><li class="ql-indent-1">Indented item</li></ol>';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with style-based indentation', () => {
      const html = '<ol><li style="margin-left: 40px">Styled item</li></ol>';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with nested lists', () => {
      const html = '<ol><li>Item 1<ol><li>Nested item</li></ol></li></ol>';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with ql-ui spans', () => {
      const html = '<ol><li><span class="ql-ui"></span>Item with UI span</li></ol>';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with both ordered and unordered lists', () => {
      const html = '<ol><li>Ordered item</li></ol><ul><li>Unordered item</li></ul>';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles complex HTML with multiple attributes', () => {
      const html =
        '<ol><li class="ql-indent-2" data-indent="2" style="padding-left: 80px">Complex item</li></ol>';
      const result = htmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('applies indentation from padding-left styles', () => {
      const html = `
        <ol>
          <li style="padding-left: 80px">Indented px</li>
          <li style="padding-left: 4rem">Indented rem</li>
        </ol>
      `;
      const result = htmlToDelta(html);
      const indentOps = result.ops.filter((op) => op.attributes?.indent);
      expect(indentOps.length).toBeGreaterThanOrEqual(2);
    });

    it('captures text preceding nested lists', () => {
      const html = `
        <ul>
          <li>Intro text<ul><li>Nested</li></ul></li>
        </ul>
      `;
      const result = htmlToDelta(html);
      expect(
        result.ops.some(
          (op) => typeof op.insert === 'string' && op.insert.includes('Intro text'),
        ),
      ).toBe(true);
    });
  });

  describe('parseHtmlToDelta', () => {
    beforeEach(() => {
      global.DOMParser = jest.fn(() => ({
        parseFromString: jest.fn(() => ({
          body: {
            childNodes: [],
            hasChildNodes: () => false,
          },
        })),
      }));

      global.document = {
        createElement: jest.fn(() => ({
          innerHTML: '',
          childNodes: [],
          hasChildNodes: () => false,
        })),
      };
    });

    afterEach(() => {
      global.DOMParser = originalDOMParser;
      global.document = originalDocument;
    });

    it('returns a delta object when called', () => {
      const html = '<p>Simple text</p>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('handles empty string input', () => {
      const html = '';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles null input gracefully', () => {
      const html = null;
      expect(() => parseHtmlToDelta(html)).not.toThrow();
    });

    it('handles undefined input gracefully', () => {
      const html = undefined;
      expect(() => parseHtmlToDelta(html)).not.toThrow();
    });

    it('handles simple paragraph HTML', () => {
      const html = '<p>Simple paragraph</p>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with multiple paragraphs', () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with formatted text', () => {
      const html = '<p><strong>Bold text</strong> and <em>italic text</em></p>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with links', () => {
      const html = '<p><a href="https://example.com">Link text</a></p>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with lists', () => {
      const html = '<ul><li>First item</li><li>Second item</li></ul>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with headers', () => {
      const html = '<h1>Header 1</h1><h2>Header 2</h2>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with blockquotes', () => {
      const html = '<blockquote>Quoted text</blockquote>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with code blocks', () => {
      const html = '<pre><code>Code block content</code></pre>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with inline code', () => {
      const html = '<p>Text with <code>inline code</code></p>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles complex nested HTML structure', () => {
      const html = `
        <div>
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2 with <a href="#">link</a></li>
          </ul>
          <blockquote>Quote with <code>code</code></blockquote>
        </div>
      `;
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('processes complex DOM trees when DOMParser provides structured nodes', () => {
      const complexDoc = {
        body: {
          childNodes: [
            createElementNode('p', {
              classes: ['ql-indent-1'],
              style: { marginLeft: '40px' },
              childNodes: [
                createElementNode('strong', { childNodes: [createTextNode('Bold')] }),
                createTextNode(' plain '),
                createElementNode('em', { childNodes: [createTextNode('Italic')] }),
                createElementNode('u', { childNodes: [createTextNode('Underline')] }),
                createElementNode('s', { childNodes: [createTextNode('Strike')] }),
                createElementNode('a', {
                  attributes: { href: '/link' },
                  childNodes: [createTextNode('Link')],
                }),
              ],
            }),
            createElementNode('ol', {
              childNodes: [
                createElementNode('li', {
                  classes: ['ql-indent-1'],
                  childNodes: [
                    createTextNode('Numbered item'),
                    createElementNode('br'),
                    createElementNode('ul', {
                      childNodes: [
                        createElementNode('li', {
                          attributes: { 'data-indent': '2' },
                          style: { paddingLeft: '40px' },
                          childNodes: [createTextNode('Nested bullet')],
                        }),
                      ],
                    }),
                  ],
                }),
                createElementNode('li', {
                  style: { marginLeft: '40px' },
                  childNodes: [createTextNode('Second item')],
                }),
              ],
            }),
            createElementNode('ul', {
              childNodes: [
                createElementNode('li', {
                  style: { paddingLeft: '80px' },
                  childNodes: [createTextNode('Bullet item')],
                }),
                createElementNode('li', {
                  childNodes: [
                    createElementNode('ol', {
                      childNodes: [
                        createElementNode('li', {
                          childNodes: [createTextNode('Nested ordered')],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            createElementNode('div', {
              classes: ['ql-indent-2'],
              childNodes: [createElementNode('br')],
            }),
            createElementNode('span', {
              classes: ['ql-ui'],
              childNodes: [createTextNode('ignored')],
            }),
            createElementNode('h1', { childNodes: [createTextNode('Heading 1')] }),
            createElementNode('h2', { childNodes: [createTextNode('Heading 2')] }),
            createElementNode('h3', { childNodes: [createTextNode('Heading 3')] }),
            createElementNode('h4', { childNodes: [createTextNode('Heading 4')] }),
            createElementNode('h5', { childNodes: [createTextNode('Heading 5')] }),
            createElementNode('h6', { childNodes: [createTextNode('Heading 6')] }),
          ],
        },
      };

      global.DOMParser.mockImplementation(
        () => ({
          parseFromString: () => complexDoc,
        }),
      );

      const result = parseHtmlToDelta('<div>ignored</div>');
      const ops = result.ops;

      expect(ops.length).toBeGreaterThan(0);
      expect(ops.some((op) => op.attributes?.bold)).toBe(true);
      expect(ops.some((op) => op.attributes?.italic)).toBe(true);
      expect(ops.some((op) => op.attributes?.underline)).toBe(true);
      expect(ops.some((op) => op.attributes?.strike)).toBe(true);
      expect(ops.some((op) => op.attributes?.link === '/link')).toBe(true);
      expect(ops.filter((op) => op.attributes?.list === 'ordered').length).toBeGreaterThan(0);
      expect(ops.filter((op) => op.attributes?.list === 'bullet').length).toBeGreaterThan(0);
      expect(ops.some((op) => op.attributes?.indent && op.attributes.indent > 0)).toBe(true);
      const headerLevels = ops
        .filter((op) => op.attributes?.header)
        .map((op) => op.attributes.header);
      expect(headerLevels).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6]));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles malformed HTML gracefully', () => {
      const html = '<p>Unclosed paragraph<div>Mixed tags</p></div>';
      expect(() => parseHtmlToDelta(html)).not.toThrow();
      expect(() => htmlToDelta(html)).not.toThrow();
    });

    it('handles HTML with special characters', () => {
      const html = '<p>&amp; &lt; &gt; &quot; &#39;</p>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with unicode characters', () => {
      const html = '<p>Unicode: 🔥 💯 ✨</p>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles very long HTML content', () => {
      const longContent = 'a'.repeat(10000);
      const html = `<p>${longContent}</p>`;
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });

    it('handles HTML with no content', () => {
      const html = '<div></div>';
      const result = parseHtmlToDelta(html);

      expect(result).toBeDefined();
    });
  });
});
