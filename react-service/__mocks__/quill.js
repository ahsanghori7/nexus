const MockDelta = jest.fn(function(ops) {
  this.ops = ops || [];
  return this;
});

MockDelta.prototype.insert = jest.fn(function(text, attributes) {
  this.ops.push({ insert: text, attributes });
  return this;
});

MockDelta.prototype.delete = jest.fn(function(length) {
  this.ops.push({ delete: length });
  return this;
});

MockDelta.prototype.retain = jest.fn(function(length, attributes) {
  this.ops.push({ retain: length, attributes });
  return this;
});

const Quill = jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    clipboard: {
      dangerouslyPasteHTML: jest.fn(),
      convert: jest.fn()
    },
    getContents: jest.fn(() => ({ ops: [] })),
    setContents: jest.fn(),
    getText: jest.fn(() => ''),
    getSelection: jest.fn(),
    getLength: jest.fn(() => 0),
    getLeaf: jest.fn(() => []),
    getBounds: jest.fn(),
    getLines: jest.fn(() => []),
    getFormat: jest.fn(() => ({})),
    insertEmbed: jest.fn(),
    insertText: jest.fn(),
    formatLine: jest.fn(),
    formatText: jest.fn(),
    updateContents: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn(),
    hasFocus: jest.fn(),
    getModule: jest.fn(() => ({
      container: document.createElement('div')
    })),
    enable: jest.fn(),
    disable: jest.fn(),
    removeFormat: jest.fn()
  }));

  Quill.register = jest.fn();
  Quill.sources = {
    USER: 'user',
    SILENT: 'silent',
    API: 'api'
  };

  Quill.import = jest.fn((name) => {
    if (name === 'delta') {
      return MockDelta;
    }
    return jest.fn();
  });

  Quill.imports = {
    'delta': MockDelta,
    'parchment': {
      Attributor: {
        Attribute: jest.fn(),
        Class: jest.fn(),
        Style: jest.fn()
      }
    }
  };

  module.exports = Quill;
