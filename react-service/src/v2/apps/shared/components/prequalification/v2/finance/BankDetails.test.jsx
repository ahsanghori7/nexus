import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BankDetails from './BankDetails.jsx';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mockFinanceInput = jest.fn(({ name, label, handleBlur }) => (
  <input
    data-testid={name}
    aria-label={label}
    onBlur={(event) => handleBlur?.(event)}
  />
));

jest.mock('./FinanceInput', () => ({
  __esModule: true,
  default: (props) => mockFinanceInput(props),
}));

jest.mock('v2/apps/shared/components/company-v2/Mui.styled', () => ({
  MuiSubtitle: ({ children }) => <div data-testid="subtitle">{children}</div>,
}));

describe('BankDetails', () => {
  beforeEach(() => {
    mockFinanceInput.mockClear();
  });

  it('renders section headings and passes translated labels to inputs', () => {
    render(
      <BankDetails
        register={jest.fn().mockReturnValue({})}
        errors={{}}
        validation={{}}
      />,
    );

    const subtitles = screen.getAllByTestId('subtitle');
    expect(subtitles[0]).toHaveTextContent('financial-bank-details');
    expect(subtitles[1]).toHaveTextContent('prequalification-bank_details');

    const expectedFields = [
      'bank_name',
      'address',
      'sort_code',
      'account_number',
      'vat_number',
    ];
    expect(mockFinanceInput).toHaveBeenCalledTimes(expectedFields.length);
    expectedFields.forEach((field, index) => {
      expect(mockFinanceInput.mock.calls[index][0]).toEqual(
        expect.objectContaining({ name: field, labelAdornment: true }),
      );
    });
  });

  it('invokes changeCompanyData with field-specific values on blur', () => {
    const changeCompanyData = jest.fn();
    render(
      <BankDetails
        register={jest.fn().mockReturnValue({})}
        errors={{}}
        validation={{}}
        changeCompanyData={changeCompanyData}
      />,
    );

    fireEvent.blur(screen.getByTestId('bank_name'), {
      target: { value: 'CL Bank' },
    });
    fireEvent.blur(screen.getByTestId('account_number'), {
      target: { value: '12345678' },
    });

    expect(changeCompanyData).toHaveBeenCalledWith('CL Bank', 'bank_name');
    expect(changeCompanyData).toHaveBeenCalledWith('12345678', 'account_number');
  });
});
