import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SiteConstraints from 'v2/apps/clink/pages/pmp/project-details/site-constraints/SiteConstraints';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

describe('SiteConstraints', () => {
  const renderComponent = (override = {}) => {
    const setSiteConstrains = jest.fn();
    const useUpdateProject = {
      useSiteConstrains: ['existing constraints', setSiteConstrains],
      ...override,
    };

    render(<SiteConstraints useUpdateProject={useUpdateProject} />);

    return { setSiteConstrains };
  };

  it('renders the constraints textarea', () => {
    renderComponent();

    const textbox = screen.getByRole('textbox', { name: 'site-constrains' });
    expect(textbox).toBeInTheDocument();
    expect(textbox).toHaveValue('existing constraints');
  });

  it('invokes updater when value changes', () => {
    const { setSiteConstrains } = renderComponent();

    fireEvent.change(
      screen.getByRole('textbox', { name: 'site-constrains' }),
      { target: { value: 'updated value' } },
    );

    expect(setSiteConstrains).toHaveBeenCalledWith('updated value');
  });
});
