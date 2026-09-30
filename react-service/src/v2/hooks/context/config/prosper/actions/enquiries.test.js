import enquiriesActions from './enquiries';
import { goToNewTab } from 'v2/helpers/url';

// Mock the helper function
jest.mock('v2/helpers/url', () => ({
  goToNewTab: jest.fn()
}));

describe('prosper enquiriesActions', () => {
  test('should export an array', () => {
    expect(Array.isArray(enquiriesActions)).toBe(true);
  });

  test('should have at least one action', () => {
    expect(enquiriesActions.length).toBeGreaterThan(0);
  });

  test('should have properly structured actions', () => {
    enquiriesActions.forEach(action => {
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('text');
      expect(action).toHaveProperty('handleAction');
      expect(typeof action.id).toBe('number');
      expect(typeof action.text).toBe('string');
      expect(typeof action.handleAction).toBe('function');
    });
  });

  test('should have download tender documents action', () => {
    const downloadAction = enquiriesActions.find(action => action.text === 'Download tender documents');
    expect(downloadAction).toBeDefined();
    expect(downloadAction.id).toBe(1);
    expect(downloadAction.align).toBe('right');
  });

  test('should have send quotation action', () => {
    const quotationAction = enquiriesActions.find(action => action.text === 'Send a quotation');
    expect(quotationAction).toBeDefined();
    expect(quotationAction.id).toBe(2);
  });

  test('should handle download action properly', () => {
    const downloadAction = enquiriesActions.find(action => action.text === 'Download tender documents');
    const mockDocument = 'test-document';
    
    downloadAction.handleAction(mockDocument);
    
    expect(goToNewTab).toHaveBeenCalledWith(mockDocument);
  });

  test('should handle quotation action properly', () => {
    const quotationAction = enquiriesActions.find(action => action.text === 'Send a quotation');
    
    const result = quotationAction.handleAction();
    
    expect(result).toBeNull();
  });

  test('should have unique ids', () => {
    const ids = enquiriesActions.map(action => action.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids).toHaveLength(uniqueIds.length);
  });

  test('actions with align property should have valid alignment', () => {
    const validAlignments = ['left', 'center', 'right'];
    enquiriesActions.forEach(action => {
      if (action.align) {
        expect(validAlignments).toContain(action.align);
      }
    });
  });
});