import navItems from './oldNavItems';

// Mock the dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => `mocked_${key}`,
}));

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

describe('oldNavItems', () => {
  it('returns navigation items array when called without parameters', () => {
    const items = navItems();

    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(5);
  });

  it('returns navigation items array when isEditable is false', () => {
    const items = navItems('test-slug', false);

    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(5);
  });

  it('returns navigation items with PMP section when isEditable is true', () => {
    const items = navItems('test-slug', true);

    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(6);
    expect(items[0]).toEqual({
      icon: 'pmp-icon',
      label: 'mocked_plan-my-project',
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

  it('uses slug parameter in URLs correctly', () => {
    const slug = 'my-project-123';
    const items = navItems(slug, false);

    expect(items[0].urls[0].url).toBe(`/main-contractor/project/${slug}/procurement_schedule`);
    expect(items[1].urls[0].url).toBe(`/main-contractor/project/${slug}/issue_enquiry`);
  });

  it('returns items with empty slug when no parameter provided', () => {
    const items = navItems();

    expect(items[0].urls[0].url).toBe(
      '/main-contractor/project//procurement_schedule',
    );
  });

  it('contains all expected navigation sections when not editable', () => {
    const items = navItems('test', false);

    const expectedLabels = [
      'mocked_procurement-tools',
      'mocked_project-documents',
      'mocked_instructions-variations',
      'mocked_ncr',
      'mocked_forecast-final',
    ];

    const labels = items.map((item) => item.label);

    expect(labels).toEqual(expectedLabels);
  });

  it('has correct icons for each section', () => {
    const items = navItems('test', false);

    expect(items[0].icon).toBe('tools-icon');
    expect(items[1].icon).toBe('project-icon');
    expect(items[2].icon).toBe('instructions-icon');
    expect(items[3].icon).toBe('ncr-icon');
    expect(items[4].icon).toBe('forecast-icon');
  });

  it('has correct number of URLs per section', () => {
    const items = navItems('test', false);

    expect(items[0].urls).toHaveLength(3); // procurement-tools
    expect(items[1].urls).toHaveLength(3); // project-documents
    expect(items[2].url).toBeDefined(); // instructions-variations (single url)
    expect(items[3].url).toBeDefined(); // ncr (single url)
    expect(items[4].url).toBeDefined(); // forecast-final (single url)
  });

  it('includes PMP section URLs when editable', () => {
    const items = navItems('test-slug', true);

    const pmpSection = items[0];
    expect(pmpSection.label).toBe('mocked_plan-my-project');
    expect(pmpSection.urls).toHaveLength(5);

    const pmpUrls = pmpSection.urls.map((u) => u.label);
    expect(pmpUrls[0]).toContain('mocked_project-overview');
    expect(pmpUrls[1]).toContain('mocked_project-team');
    expect(pmpUrls[2]).toContain('mocked_scope-and-details');
    expect(pmpUrls[3]).toContain('mocked_reference-files');
    expect(pmpUrls[4]).toContain('mocked_work-packages');
  });
});
