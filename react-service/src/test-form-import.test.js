// Test that mimics the exact import pattern used in the Form component
import { CONSTANTS } from 'clink-components';

const { upload } = CONSTANTS.s3;

describe('Form Import Pattern Test', () => {
  it('should destructure upload from CONSTANTS.s3 at module level', () => {
    expect(upload).toBe('mock-upload-icon');
  });
});