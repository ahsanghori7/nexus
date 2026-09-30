jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => key),
  })),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(() => ({ accountId: 'account-42' })),
}));

jest.mock('v2/apps/admin/pages/prosper/Accounts/company', () => {
  const React = require('react');
  return (props) => React.createElement('mock-company-profile', props);
});

jest.mock('v2/apps/admin/pages/prosper/Accounts/prequalification', () => {
  const React = require('react');
  return (props) => React.createElement('mock-prequalification', props);
});

jest.mock('v2/apps/admin/DataTable', () => {
  const React = require('react');
  return (props) => React.createElement('mock-data-table', props);
});

import tabs from 'v2/apps/admin/pages/prosper/Accounts/tabs.jsx';

describe('prosper admin account tabs configuration', () => {
  it('builds the expected tab list with ids and labels', () => {
    const result = tabs('prosper', 'user-7');

    expect(result).toHaveLength(6);
    expect(result.map(({ label }) => label)).toEqual([
      'profile-information',
      'prequalification-information',
      'activity',
      'clink-opportunities-title',
      'engagement',
      'clink-supply-chain-title',
    ]);

    expect(result[0].content.props.id).toBe('account-42');
    expect(result[2].content.props.dataType).toBe('activity');
    expect(result[4].content.props.id).toBe('user-7');
    expect(result[4].content.props.table).toBe('user');
    expect(result[5].content.props.dataType).toBe('supply_chain');
  });

  it('passes the context type through to every tab content', () => {
    const result = tabs('prosper', 'user-7');

    result.forEach(({ content }) => {
      expect(content.props.contextType).toBe('prosper');
    });
  });
});
