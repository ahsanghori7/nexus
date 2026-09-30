import '@testing-library/jest-dom';
import useTheme from './index';

// Mock the theme imports
jest.mock('./prosper', () => ({ name: 'prosper-theme' }));
jest.mock('./clink', () => ({ name: 'clink-theme' }));
jest.mock('./pegasus', () => ({ name: 'pegasus-theme' }));
jest.mock('./prosperEnquiries', () => ({ name: 'prosper-enquiries-theme' }));

describe('useTheme', () => {
  it('returns clink theme when context is "clink"', () => {
    const result = useTheme('clink');
    expect(result).toEqual({ name: 'clink-theme' });
  });

  it('returns pegasus theme when context is "pegasus"', () => {
    const result = useTheme('pegasus');
    expect(result).toEqual({ name: 'pegasus-theme' });
  });

  it('returns prosperEnquiries theme when context is "prosperEnquiries"', () => {
    const result = useTheme('prosperEnquiries');
    expect(result).toEqual({ name: 'prosper-enquiries-theme' });
  });

  it('returns prosper theme by default when context is not recognized', () => {
    const result = useTheme('unknown-context');
    expect(result).toEqual({ name: 'prosper-theme' });
  });

  it('returns prosper theme by default when context is undefined', () => {
    const result = useTheme(undefined);
    expect(result).toEqual({ name: 'prosper-theme' });
  });

  it('returns prosper theme by default when context is null', () => {
    const result = useTheme(null);
    expect(result).toEqual({ name: 'prosper-theme' });
  });

  it('returns prosper theme by default when context is empty string', () => {
    const result = useTheme('');
    expect(result).toEqual({ name: 'prosper-theme' });
  });

  it('handles all valid theme contexts correctly', () => {
    const contexts = ['clink', 'pegasus', 'prosperEnquiries'];
    const expectedResults = [
      { name: 'clink-theme' },
      { name: 'pegasus-theme' },
      { name: 'prosper-enquiries-theme' }
    ];

    contexts.forEach((context, index) => {
      const result = useTheme(context);
      expect(result).toEqual(expectedResults[index]);
    });
  });

  it('is case sensitive for theme context', () => {
    // Test that case sensitivity matters
    expect(useTheme('CLINK')).toEqual({ name: 'prosper-theme' }); // should fall to default
    expect(useTheme('Clink')).toEqual({ name: 'prosper-theme' }); // should fall to default
    expect(useTheme('pegaSUS')).toEqual({ name: 'prosper-theme' }); // should fall to default
  });

  it('returns a theme object for all inputs', () => {
    const testCases = ['clink', 'pegasus', 'prosperEnquiries', 'invalid', undefined, null];
    
    testCases.forEach(testCase => {
      const result = useTheme(testCase);
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('name');
    });
  });
});