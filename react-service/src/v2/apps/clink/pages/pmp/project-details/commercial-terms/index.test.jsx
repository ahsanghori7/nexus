import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommercialTerms from 'v2/apps/clink/pages/pmp/project-details/commercial-terms';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('CommercialTerms', () => {
  const renderComponent = (performanceBond, override = {}) => {
    const setIsPerformanceBond = jest.fn();

    const useUpdateProject = {
      usePerformanceBond: [performanceBond, setIsPerformanceBond],
      ...override,
    };

    render(<CommercialTerms useUpdateProject={useUpdateProject} />);

    return { setIsPerformanceBond };
  };

  it('renders the section title and passes current value to radio group', () => {
    renderComponent(true);

    expect(screen.getByText('commercial-terms')).toBeInTheDocument();
    expect(screen.getByTestId('radio-group')).toHaveAttribute('value', 'true');
  });

  it('handles radio selection changes', () => {
    const { setIsPerformanceBond } = renderComponent(null);

    const labels = screen.getAllByTestId('mui-form-control-label');
    const yesLabel = labels.find((label) =>
      label.textContent?.includes('yes'),
    );
    const noLabel = labels.find((label) => label.textContent?.includes('no'));

    expect(yesLabel).toBeDefined();
    expect(noLabel).toBeDefined();

    const yesInput = yesLabel.querySelector('input');
    const noInput = noLabel.querySelector('input');

    expect(yesInput).toBeTruthy();
    expect(noInput).toBeTruthy();

    fireEvent.click(yesInput);
    fireEvent.click(noInput);

    expect(setIsPerformanceBond).toHaveBeenCalledTimes(2);
    expect(setIsPerformanceBond).toHaveBeenCalledWith(true);
    expect(setIsPerformanceBond).toHaveBeenCalledWith(false);
  });
});
