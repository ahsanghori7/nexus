import { instructionsBreadcrumbs } from './helpers';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    const translations = {
      'clink-projects-title': 'Projects',
    };
    return translations[key] || key;
  }),
}));

// Mock BASE_URLS global
global.BASE_URLS = {
  CLINK: '/clink',
};

describe('template helpers', () => {
  describe('instructionsBreadcrumbs', () => {
    const mockSlug = 'test-project';
    const mockType = 'ncr';
    const mockTitle = 'Test NCR';
    const mockData = { name: 'Test Project' };

    it('returns basic breadcrumbs structure', () => {
      const breadcrumbs = instructionsBreadcrumbs(mockSlug, mockType, mockTitle, mockData);
      
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0]).toEqual({
        id: 1,
        text: 'Projects',
        url: '/clink',
      });
      expect(breadcrumbs[1]).toEqual({
        id: 2,
        text: 'Test Project',
        url: '/clink/project_dashboard/test-project',
        reactLink: true,
      });
      expect(breadcrumbs[2]).toEqual({
        id: 3,
        text: 'Test NCR',
        url: '/clink/project/test-project/ncr',
        reactLink: true,
      });
    });

    it('works with instructions-variations type', () => {
      const breadcrumbs = instructionsBreadcrumbs(mockSlug, 'instructions-variations', mockTitle, mockData);
      
      expect(breadcrumbs[2].url).toBe('/clink/project/test-project/instructions_variations');
    });

    it('includes extra breadcrumb when specified', () => {
      const breadcrumbs = instructionsBreadcrumbs(
        mockSlug, 
        mockType, 
        mockTitle, 
        mockData, 
        true, 
        false
      );
      
      expect(breadcrumbs).toHaveLength(4);
      expect(breadcrumbs[3]).toEqual({
        id: 4,
        text: 'Add Test NCR',
      });
    });

    it('shows Edit prefix when edit is true', () => {
      const breadcrumbs = instructionsBreadcrumbs(
        mockSlug, 
        mockType, 
        mockTitle, 
        mockData, 
        true, 
        true
      );
      
      expect(breadcrumbs[3].text).toBe('Edit Test NCR');
    });

    it('handles missing data gracefully', () => {
      const breadcrumbs = instructionsBreadcrumbs(mockSlug, mockType, mockTitle, {});
      
      expect(breadcrumbs[1].text).toBe('');
    });

    it('can set reactLink to false', () => {
      const breadcrumbs = instructionsBreadcrumbs(
        mockSlug, 
        mockType, 
        mockTitle, 
        mockData, 
        false, 
        false, 
        false
      );
      
      expect(breadcrumbs[1].reactLink).toBe(false);
      expect(breadcrumbs[2].reactLink).toBe(false);
    });
  });
});