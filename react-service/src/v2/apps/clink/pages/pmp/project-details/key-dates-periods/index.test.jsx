import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
var mockSectional;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock(
  'v2/apps/clink/pages/pmp/project-details/key-dates-periods/SectionalCompletionDates',
  () => {
    const React = require('react');
    mockSectional = jest.fn((props) =>
      React.createElement('div', { 'data-testid': 'sectional-component' }),
    );
    return {
      __esModule: true,
      default: mockSectional,
    };
  },
);

import KeyDates from 'v2/apps/clink/pages/pmp/project-details/key-dates-periods';

const setupHooks = () => {
  const setDatePossessionSite = jest.fn();
  const setSectionalCompletionDates = jest.fn();
  const setReviewPeriodDrawings = jest.fn();
  const setAdvanceWarningPeriod = jest.fn();
  const setGlobalDateForPossession = jest.fn();
  const setProjectSections = jest.fn();

  const initialSections = [
    {
      id: 1,
      name: 'Phase 1',
      possessionDate: '',
      completionDate: '2024-05-01',
    },
  ];

  return {
    useUpdateProject: {
      useDatePossessionSite: ['2024-02-01', setDatePossessionSite],
      useSectionalCompletionDates: [true, setSectionalCompletionDates],
      useReviewPeriodDrawings: ['14 days', setReviewPeriodDrawings],
      useAdvanceWarningPeriod: ['7 days', setAdvanceWarningPeriod],
      useErrorKeyDates: [[]],
      useGlobalDateForPossession: ['2024-03-01', setGlobalDateForPossession],
      useProjectSections: [initialSections, setProjectSections],
    },
    setters: {
      setDatePossessionSite,
      setSectionalCompletionDates,
      setReviewPeriodDrawings,
      setAdvanceWarningPeriod,
      setGlobalDateForPossession,
      setProjectSections,
    },
    initialSections,
  };
};

describe('KeyDates', () => {
  beforeEach(() => {
    mockSectional.mockClear();
  });

  it('normalizes sections and propagates props to SectionalCompletionDates', async () => {
    const { useUpdateProject, setters, initialSections } = setupHooks();

    render(<KeyDates useUpdateProject={useUpdateProject} />);

    expect(mockSectional).toHaveBeenCalledTimes(1);
    const sectionalProps = mockSectional.mock.calls[0][0];
    expect(sectionalProps.projectSections).toEqual(initialSections);
    expect(sectionalProps.globalDateForPossession).toBe('2024-03-01');

    sectionalProps.onChangeGlobalDate('2024-04-04');
    expect(setters.setGlobalDateForPossession).toHaveBeenCalledWith('2024-04-04');

    await waitFor(() => {
      expect(setters.setProjectSections).toHaveBeenCalledWith([
        {
          ...initialSections[0],
          possessionDate: '2024-03-01',
        },
      ]);
    });
  });

  it('updates form fields and toggles sectional completion state', () => {
    const { useUpdateProject, setters } = setupHooks();

    render(<KeyDates useUpdateProject={useUpdateProject} />);

    fireEvent.change(screen.getByLabelText('date-possestion-site'), {
      target: { value: '2024-04-10' },
    });
    fireEvent.change(screen.getByLabelText(/review-period-drawings/i), {
      target: { value: '21 days' },
    });
    fireEvent.change(screen.getByLabelText(/advance-warning-notification/i), {
      target: { value: '10 days' },
    });

    const radios = screen.getAllByTestId('radio-group')[0].querySelectorAll(
      'input',
    );
    fireEvent.click(radios[1]);

    expect(setters.setDatePossessionSite).toHaveBeenCalledWith('2024-04-10');
    expect(setters.setReviewPeriodDrawings).toHaveBeenCalledWith('21 days');
    expect(setters.setAdvanceWarningPeriod).toHaveBeenCalledWith('10 days');
    expect(setters.setSectionalCompletionDates).toHaveBeenCalledWith(false);
    expect(setters.setProjectSections).toHaveBeenCalledWith([]);
  });
});
