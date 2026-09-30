// Simple test to check if CONSTANTS.s3.upload is accessible
import { CONSTANTS } from 'clink-components';

describe('Constants Test', () => {
  it('should have CONSTANTS.s3.upload available', () => {
    expect(CONSTANTS).toBeDefined();
    expect(CONSTANTS.s3).toBeDefined();
    expect(CONSTANTS.s3.upload).toBeDefined();
    expect(CONSTANTS.s3.upload).toBe('mock-upload-icon');
  });
});