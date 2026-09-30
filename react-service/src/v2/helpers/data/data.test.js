import {
  renderHtmlInText,
  renderTextWithoutHtml,
  b64EncodeUnicode,
  UnicodeDecodeB64,
  getAddress,
  exportAttribute,
} from './index';
import ReactHtmlParser from 'react-html-parser';
import DOMPurify from 'dompurify';

// Mock ReactHtmlParser and DOMPurify
jest.mock('react-html-parser');
jest.mock('dompurify');

describe('renderHtmlInText', () => {
    beforeEach(() => {
      ReactHtmlParser.mockClear();
      // Reset the mock implementation before each test
      ReactHtmlParser.mockImplementation(text => text);
    });

    it('should parse HTML when text contains HTML', () => {
      const htmlText = '<p>Hello</p>';
      ReactHtmlParser.mockReturnValue(['Hello']);
      const result = renderHtmlInText(htmlText);
      expect(ReactHtmlParser).toHaveBeenCalledWith(htmlText);
      expect(result).toEqual(['Hello']);
    });

  });

describe('renderTextWithoutHtml', () => {
  beforeEach(() => {
    DOMPurify.sanitize.mockClear();
  });

  it('should strip HTML and return text content', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    DOMPurify.sanitize.mockReturnValue(html);

    // Mock DOM methods
    document.createElement = jest.fn(() => ({
      innerHTML: '',
      textContent: 'Hello World',
    }));

    const result = renderTextWithoutHtml(html);
    expect(DOMPurify.sanitize).toHaveBeenCalledWith(html);
    expect(result).toBe('Hello World');
  });

  it('should handle empty input', () => {
    DOMPurify.sanitize.mockReturnValue('');
    document.createElement = jest.fn(() => ({
      innerHTML: '',
      textContent: '',
    }));

    const result = renderTextWithoutHtml('');
    expect(result).toBe('');
  });
});

describe('b64EncodeUnicode', () => {
  it('should correctly encode Unicode strings to base64', () => {
    // Mock btoa and encodeURIComponent
    global.btoa = jest.fn((str) => 'base64_' + str);
    global.encodeURIComponent = jest.fn((str) => 'encoded_' + str);

    const input = 'Hello 世界';
    const result = b64EncodeUnicode(input);
    expect(encodeURIComponent).toHaveBeenCalledWith(input);
    expect(btoa).toHaveBeenCalledWith('encoded_Hello 世界');
    expect(result).toBe('base64_encoded_Hello 世界');
  });
});

describe('UnicodeDecodeB64', () => {
  it('should correctly decode base64 to Unicode strings', () => {
    // Mock atob and decodeURIComponent
    global.atob = jest.fn((str) => 'decoded_' + str);
    global.decodeURIComponent = jest.fn((str) => 'unicode_' + str);

    const input = 'SGVsbG8g5LiW55WM';
    const result = UnicodeDecodeB64(input);
    expect(atob).toHaveBeenCalledWith(input);
    expect(decodeURIComponent).toHaveBeenCalledWith('decoded_SGVsbG8g5LiW55WM');
    expect(result).toBe('unicode_decoded_SGVsbG8g5LiW55WM');
  });
});

describe('getAddress', () => {
  it('should return string address as-is', () => {
    const address = '123 Main St, City, 12345';
    expect(getAddress(address)).toBe(address);
  });

  it('should format address object correctly', () => {
    const addressObj = {
      premises: '42',
      address_line_1: 'Main St',
      locality: 'City',
      postal_code: '12345',
    };
    expect(getAddress(addressObj)).toBe('42 Main St, City, 12345');
  });

  it('should handle missing address object properties', () => {
    const addressObj = {
      address_line_1: 'Main St',
      locality: 'City',
    };
    expect(getAddress(addressObj)).toBe(' Main St, City, ');
  });

  it('should handle null input', () => {
    expect(getAddress(null)).toBe('');
  });
});

describe('exportAttribute', () => {
  it('should return attribute value when it exists', () => {
    const data = { name: 'John', age: 30 };
    expect(exportAttribute(data, 'name')).toBe('John');
  });

  it("should return default value when attribute doesn't exist", () => {
    const data = { name: 'John' };
    expect(exportAttribute(data, 'age', 25)).toBe(25);
  });

  it('should return null when data is not an object', () => {
    expect(exportAttribute(null, 'name')).toBeNull();
    expect(exportAttribute(undefined, 'name')).toBeNull();
    expect(exportAttribute('string', 'name')).toBeNull();
  });

  it("should return null when no default value is provided and attribute doesn't exist", () => {
    const data = { name: 'John' };
    expect(exportAttribute(data, 'age')).toBeNull();
  });
});
