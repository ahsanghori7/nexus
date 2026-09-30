import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OpeningHours from 'v2/apps/clink/pages/pmp/project-details/site-constraints/OpeningHours';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));
describe('OpeningHours', () => {
  const renderComponent = (override = {}) => {
    const setWeekdays = jest.fn();
    const setWeekends = jest.fn();

    const useUpdateProject = {
      useWeekdays: ['Mon-Fri 8-17', setWeekdays],
      useWeekends: ['Sat 9-12', setWeekends],
      useErrorsTwo: [undefined],
      ...override,
    };

    render(<OpeningHours useUpdateProject={useUpdateProject} />);

    return { setWeekdays, setWeekends };
  };

  it('renders weekday and weekend inputs with initial values', () => {
    renderComponent();

    expect(screen.getByLabelText(/opening-hours-1/i)).toHaveValue(
      'Mon-Fri 8-17',
    );
    expect(screen.getByLabelText(/opening-hours-2/i)).toHaveValue('Sat 9-12');
  });

  it('updates hours when user types', () => {
    const { setWeekdays, setWeekends } = renderComponent();

    fireEvent.change(screen.getByLabelText(/opening-hours-1/i), {
      target: { value: 'Mon-Fri 9-18' },
    });
    fireEvent.change(screen.getByLabelText(/opening-hours-2/i), {
      target: { value: 'Sun closed' },
    });

    expect(setWeekdays).toHaveBeenCalledWith('Mon-Fri 9-18');
    expect(setWeekends).toHaveBeenCalledWith('Sun closed');
  });
});
