import { assistant } from 'v2/helpers/roles';
import navItems from './navItems';

// Mock the dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => `mocked_${key}`,
}));

jest.mock('v2/helpers/flags', () =>
  jest.fn((key) => key === 'PROJECT_MENU_MIGRATION'),
);

jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      instructions: 'instructions-icon',
      ncr: 'ncr-icon',
      pmp: 'pmp-icon',
      project: 'project-icon',
      tools: 'tools-icon',
      forecast: 'forecast-icon',
    },
  },
}));

describe('navItems', () => {
  it('returns navigation items array when called without slug', () => {
    const items = navItems();

    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(5);
  });

  it('returns navigation items with correct structure', () => {
    const items = navItems('test-slug');

    expect(items[0]).toEqual({
      icon: 'pmp-icon',
      label: 'mocked_project-setup',
      urls: [
        {
          label: 'mocked_project-overview',
          url: '/projects/test-slug/setup',
          external: true,
        },
        {
          label: 'mocked_project-team',
          url: '/projects/test-slug/setup/project_team',
          external: true,
        },
        {
          label: 'mocked_scope-and-details',
          url: '/projects/test-slug/setup/scope_details',
          external: true,
        },
        {
          label: 'mocked_reference-files',
          url: '/projects/test-slug/setup/reference_files',
          external: true,
        },
        {
          label: 'mocked_work-packages',
          url: '/projects/test-slug/setup/work_packages',
          external: true,
        },
      ],
    });
  });

  it('uses slug parameter in URLs correctly when editable', () => {
    const slug = 'my-project-123';
    const items = navItems(slug);

    expect(items[0].urls[0].url).toBe(`/projects/${slug}/setup`);
  });

  it('returns items with empty slug when no parameter provided', () => {
    const items = navItems();

    expect(items[0].urls[0].url).toBe('/projects//setup');
  });

  it('contains all expected navigation sections', () => {
    const items = navItems('test');

    const expectedSections = [
      'mocked_project-setup',
      'mocked_procurement',
      'mocked_project-documents',
      'mocked_site-delivery',
      'mocked_financial-tracking',
    ];

    const labels = items.map((item) => item.label);

    expect(labels).toEqual(expectedSections);
  });

  it('has correct icons for each section', () => {
    const items = navItems();

    expect(items[0].icon).toBe('pmp-icon');
    expect(items[1].icon).toBe('tools-icon');
    expect(items[2].icon).toBe('project-icon');
    expect(items[3].icon).toBe('instructions-icon');
    expect(items[4].icon).toBe('forecast-icon');
  });

  it('has correct number of URLs per section (without TENDER_RECOMMENDATION feature)', () => {
    const items = navItems();

    expect(items[0].urls).toHaveLength(5); // project-setup
    expect(items[1].urls).toHaveLength(4); // procurement (default: 4, no tender-recommendations)
    expect(items[2].urls).toHaveLength(1); // project-documents
    expect(items[3].urls).toHaveLength(2); // site-delivery
    expect(items[4].urls).toHaveLength(1); // financial-tracking
  });

  it('adds tender-recommendations when feature flag is enabled', () => {
    const items = navItems('slug', {
      features: [{ name: 'TENDER_RECOMMENDATION' }],
    });

    const procurementUrls = items[1].urls.map((u) => u.label);

    expect(procurementUrls).toContain('mocked_tender-recommendations');
    expect(items[1].urls).toHaveLength(5); // 4 base + 1 tender recommendations
  });

  it('allow team members to access Work Packages under Project Setup', () => {
    const clinkAccount = {
      acl: {
        projectList: {
          canEdit: true,
        },
      },
      user: {
        type: assistant.value,
      },
    };
    const items = navItems('', clinkAccount);
    expect(items[0].urls).toHaveLength(1); // project-setup --> Only access to Work Packages
  });
});
