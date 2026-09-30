import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderValue from './OrderValue.jsx';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mockMoney = jest.fn(({ name, label, value, onBlur }) => (
  <input
    data-testid={name}
    aria-label={label}
    defaultValue={value}
    onBlur={(event) => onBlur?.(event)}
  />
));

jest.mock('../form/Money', () => ({
  __esModule: true,
  default: (props) => mockMoney(props),
}));

jest.mock('v2/apps/shared/components/company-v2/Mui.styled', () => ({
  MuiSubtitle: ({ children }) => <div data-testid="subtitle">{children}</div>,
}));

describe('OrderValue', () => {
  beforeEach(() => {
    mockMoney.mockClear();
  });

  it('renders headings and passes translated labels to money inputs', () => {
    render(
      <OrderValue
        min_order_value={1500}
        max_order_value={7500}
        register={jest.fn().mockReturnValue({})}
        errors={{}}
        validation={{ required: true }}
      />,
    );

    const subtitles = screen.getAllByTestId('subtitle');
    expect(subtitles[0]).toHaveTextContent('order-value');
    expect(subtitles[1]).toHaveTextContent('order-value-desc');

    expect(mockMoney).toHaveBeenCalledTimes(2);
    expect(mockMoney.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        name: 'min_order_value',
        label: 'minimum',
        value: 1500,
        labelAdornment: true,
      }),
    );
    expect(mockMoney.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        name: 'max_order_value',
        label: 'maximum',
        value: 7500,
        labelAdornment: true,
      }),
    );
  });

  it('reports updated values through changeCompanyData on blur', () => {
    const changeCompanyData = jest.fn();
    render(
      <OrderValue
        register={jest.fn().mockReturnValue({})}
        errors={{}}
        validation={{}}
        changeCompanyData={changeCompanyData}
      />,
    );

    fireEvent.blur(screen.getByTestId('min_order_value'), {
      target: { value: '2000' },
    });
    fireEvent.blur(screen.getByTestId('max_order_value'), {
      target: { value: '8000' },
    });

    expect(changeCompanyData).toHaveBeenCalledWith('2000', 'min_order_value');
    expect(changeCompanyData).toHaveBeenCalledWith('8000', 'max_order_value');
  });
});
