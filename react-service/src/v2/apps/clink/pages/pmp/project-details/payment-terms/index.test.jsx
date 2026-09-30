import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentTerms from 'v2/apps/clink/pages/pmp/project-details/payment-terms';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const buildHooks = () => {
  const setInterimValuationFrequency = jest.fn();
  const setPaymentDueDate = jest.fn();
  const setFinalDateForPayment = jest.fn();
  const setDeadlinePayLessNotices = jest.fn();
  const setScheduleOfPaymentsProvided = jest.fn();
  const setAdvancePaymentProvision = jest.fn();

  return {
    useUpdateProject: {
      useInterimValuationFrequency: ['Monthly', setInterimValuationFrequency],
      usePaymentDueDate: ['14 days', setPaymentDueDate],
      useFinalDateForPayment: ['2024-03-01', setFinalDateForPayment],
      useDeadlinePayLessNotices: ['2024-03-05', setDeadlinePayLessNotices],
      useScheduleOfPaymentsProvided: [true, setScheduleOfPaymentsProvided],
      useAdvancePaymentProvision: [false, setAdvancePaymentProvision],
      useErrorsPaymentTerms: [[]],
    },
    setters: {
      setInterimValuationFrequency,
      setPaymentDueDate,
      setFinalDateForPayment,
      setDeadlinePayLessNotices,
      setScheduleOfPaymentsProvided,
      setAdvancePaymentProvision,
    },
  };
};

describe('PaymentTerms', () => {
  it('renders existing values across text inputs and radio groups', () => {
    const { useUpdateProject } = buildHooks();

    render(<PaymentTerms useUpdateProject={useUpdateProject} />);

    expect(
      screen.getByLabelText('interim-valuation-frequency'),
    ).toHaveValue('Monthly');
    expect(screen.getByLabelText('payment-due-date-text')).toHaveValue('14 days');
    expect(screen.getAllByTestId('date-picker')).toHaveLength(2);

    const radioGroups = screen.getAllByTestId('radio-group');
    expect(radioGroups).toHaveLength(2);
    expect(radioGroups[0]).toHaveAttribute('value', 'true');
    expect(radioGroups[1]).toHaveAttribute('value', 'false');
  });

  it('propagates user changes to setters', () => {
    const { useUpdateProject, setters } = buildHooks();

    render(<PaymentTerms useUpdateProject={useUpdateProject} />);

    fireEvent.change(screen.getByLabelText('interim-valuation-frequency'), {
      target: { value: 'Bi-weekly' },
    });
    fireEvent.change(screen.getByLabelText('payment-due-date-text'), {
      target: { value: '21 days' },
    });

    const datePickers = screen.getAllByTestId('date-picker');
    fireEvent.change(datePickers[0], { target: { value: '2024-04-01' } });
    fireEvent.change(datePickers[1], { target: { value: '2024-04-10' } });

    const radioGroups = screen.getAllByTestId('radio-group');
    fireEvent.click(radioGroups[0].querySelector('input[value="false"]'));
    fireEvent.click(radioGroups[1].querySelector('input[value="true"]'));

    expect(setters.setInterimValuationFrequency).toHaveBeenCalledWith('Bi-weekly');
    expect(setters.setPaymentDueDate).toHaveBeenCalledWith('21 days');
    expect(setters.setFinalDateForPayment).toHaveBeenCalledWith('2024-04-01');
    expect(setters.setDeadlinePayLessNotices).toHaveBeenCalledWith('2024-04-10');
    expect(setters.setScheduleOfPaymentsProvided).toHaveBeenCalledWith(false);
    expect(setters.setAdvancePaymentProvision).toHaveBeenCalledWith(true);
  });
});
