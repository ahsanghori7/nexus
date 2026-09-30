import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import SectionalCompletionDates from 'v2/apps/clink/pages/pmp/project-details/key-dates-periods/SectionalCompletionDates';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const baseProps = () => {
  const onChangeGlobalDate = jest.fn();
  const onAddSection = jest.fn();
  const onUpdateSection = jest.fn();
  const onRemoveSection = jest.fn();
  const onClearAllSections = jest.fn();

  return {
    props: {
      globalDateForPossession: '2024-01-01',
      projectSections: [
        {
          id: 1,
          name: 'Phase 1',
          possessionDate: '2024-02-01',
          completionDate: '2024-03-01',
        },
      ],
      onChangeGlobalDate,
      onAddSection,
      onUpdateSection,
      onRemoveSection,
      onClearAllSections,
    },
    handlers: {
      onChangeGlobalDate,
      onAddSection,
      onUpdateSection,
      onRemoveSection,
      onClearAllSections,
    },
  };
};

describe('SectionalCompletionDates', () => {
  it('renders empty state when no sections are provided', () => {
    const { props } = baseProps();
    render(
      <SectionalCompletionDates
        {...props}
        projectSections={[]}
        globalDateForPossession={null}
      />,
    );

    expect(screen.getByText('no-sections-defined')).toBeInTheDocument();
    expect(screen.getByText('click-add-section')).toBeInTheDocument();
  });

  it('handles field updates, removals, and clear all confirmation', async () => {
    const { props, handlers } = baseProps();

    render(<SectionalCompletionDates {...props} />);

    fireEvent.change(screen.getByLabelText('section-name-number'), {
      target: { value: 'Phase A' },
    });
    expect(handlers.onUpdateSection).toHaveBeenCalledWith(0, 'name', 'Phase A');

    const datePickers = screen.getAllByTestId('date-picker');
    fireEvent.change(datePickers[1], { target: { value: '2024-04-15' } });
    expect(handlers.onUpdateSection).toHaveBeenCalledWith(
      0,
      'possessionDate',
      '2024-04-15',
    );

    fireEvent.change(datePickers[2], { target: { value: '2024-05-20' } });
    expect(handlers.onUpdateSection).toHaveBeenCalledWith(
      0,
      'completionDate',
      '2024-05-20',
    );

    fireEvent.click(screen.getByRole('button', { name: 'add-section' }));
    expect(handlers.onAddSection).toHaveBeenCalled();

    fireEvent.click(screen.getAllByTestId('icon-button')[0]);
    expect(handlers.onRemoveSection).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByRole('button', { name: 'clear-all' }));
    const dialog = await screen.findByTestId('modal');
    const continueButton = within(dialog).getByText('continue');
    fireEvent.click(continueButton);
    expect(handlers.onClearAllSections).toHaveBeenCalled();
  });
});
