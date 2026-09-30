import '@testing-library/jest-dom';

// Mock i18next globally
global.i18next = {
  t: jest.fn((key) => {
    if (key === 'currency') {
      return '£'; // Changed from '$' to '£' to match test expectation
    }
    return key;
  }),
};

// Mock react-quill
jest.mock('react-quill', () => {
  const React = require('react'); // Reverted to require inside mock
  const ReactQuill = React.forwardRef(({ value, onChange }, ref) => (
    <div data-testid="mock-react-quill" ref={ref}>
      <textarea
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  ));

  ReactQuill.Quill = {
    register: jest.fn(),
    import: {
      keyword: jest.fn()
    }
  };

  return ReactQuill;
});

// Mock for Material-UI components that use DOM APIs
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  if (typeof window.requestAnimationFrame !== 'function') {
    window.requestAnimationFrame = (cb) => window.setTimeout(cb, 0);
  }

  if (typeof window.cancelAnimationFrame !== 'function') {
    window.cancelAnimationFrame = (id) => window.clearTimeout(id);
  }

  if (typeof Blob !== 'undefined' && typeof Blob.prototype.arrayBuffer !== 'function') {
    Blob.prototype.arrayBuffer = function arrayBuffer() {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Blob read failed'));
        reader.readAsArrayBuffer(this);
      });
    };
  }
}

// Mock console.error to avoid noisy Material-UI warnings
const originalConsoleError = console.error; // eslint-disable-line no-console
console.error = (...args) => {
  // eslint-disable-line no-console
  // Filter out common React warnings that aren't relevant to tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('validateDOMNesting') ||
      args[0].includes('Expected `onClick` listener') ||
      args[0].includes('is using incorrect casing') ||
      args[0].includes('unrecognized in this browser') ||
      args[0].includes('React does not recognize') ||
      args[0].includes('Invalid JSON') ||
      args[0].includes('non-boolean attribute') ||
      args[0].includes('container') ||
      args[0].includes('item') ||
      args[0].includes('error') ||
      args[0].includes('Invalid values for props') || // Filter out React Hook Form prop warnings
      args[0].includes('register`) on <input> tag') ||
      args[0].includes('trigger`) on <input> tag') ||
      args[0].includes("shouldn't contain a semicolon") || // Filter out CSS semicolon warnings
      args[0].includes('"invalid-json" is not valid JSON') || // Filter out test-specific JSON parse errors
      args[0].includes('Uncaught [SyntaxError: Unexpected token')) // Filter out unhandled JSON parse exceptions
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock console.warn to avoid common warnings
const originalConsoleWarn = console.warn; // eslint-disable-line no-console
console.warn = (...args) => {
  // eslint-disable-line no-console
  // Filter out common warnings that aren't relevant to tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Invalid JSON') || args[0].includes('subcontractor meta'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Mock ResizeObserver which is used by Material-UI
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}

  unobserve() {}

  disconnect() {}
};

// Add a helper for finding MUI components in tests
if (typeof window !== 'undefined') {
  window.findMuiElement = (container, className) => {
    return container.querySelector(`[class*="${className}"]`);
  };
}

// Add missing DOM methods that Jest doesn't include
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

// Suppress act warnings
const originalError = console.error;
console.error = (message, ...args) => {
  if (typeof message === 'string' && message.includes('act(...)')) {
    return;
  }
  originalError(message, ...args);
};

// Provide a mock global config object for tests that rely on it
global.config = {
  info: {
    // Add any properties that are accessed in the reducers
    id: 'mock-account-id',
    // Add other properties as needed by the tests
  },
  // Add other top-level config properties if necessary
  BASE_URLS: {
    APP_PROSPER: 'mock-app-prosper-url',
  },
};

// Mock global constants used in extraReducers
global.RELAY = {
  VERSION: 'mock-version',
  HOST: 'mock-host',
};

// Mock the PHPAppClinkGloblals function to return the global config object
jest.mock('v2/helpers/php-globals', () => ({
  PHPAppClinkGloblals: jest.fn(() => global.config),
}));

// Mock DataTransfer and FileList for file upload testing
class MockFileList extends Array {
  constructor(...files) {
    super();
    this.push(...files);
  }
}

class MockDataTransfer {
  constructor() {
    this.items = {
      add: jest.fn((file) => {
        // When items.add is called, add the file to our files array
        this.files.push(file);
      }),
    };
    this.files = new MockFileList(); // Start with empty MockFileList
  }
}

global.DataTransfer = MockDataTransfer;
global.FileList = MockFileList;
