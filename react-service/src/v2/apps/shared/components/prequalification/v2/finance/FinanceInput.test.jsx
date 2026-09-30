import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FinanceInput from './FinanceInput.jsx';

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        aliceBlue: '#f0f8ff',
        white: '#ffffff',
      },
    },
  },
}));

jest.mock('v2/apps/shared/components/company-v2/Mui.styled', () => ({
  MuiSubtitle: ({ children }) => <div data-testid="subtitle">{children}</div>,
}));

describe('FinanceInput', () => {
  it('shows subtitle label when labelAdornment disabled and surfaces validation errors', () => {
    const register = jest.fn().mockReturnValue({ ref: jest.fn() });
    const errors = { revenue: { message: 'Required field' } };

    render(
      <FinanceInput
        label="Revenue"
        name="revenue"
        register={register}
        errors={errors}
      />,
    );

    expect(register).toHaveBeenCalledWith(
      'revenue',
      expect.objectContaining({ required: 'Required' }),
    );
    expect(screen.getByTestId('subtitle')).toHaveTextContent('Revenue');
    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(screen.queryByTestId('input-adornment')).not.toBeInTheDocument();
  });

  it('renders label inside start adornment and forwards input events', async () => {
    const handleChange = jest.fn();
    const handleBlur = jest.fn();
    const register = jest.fn().mockReturnValue({ ref: jest.fn() });
    const user = userEvent.setup();

    render(
      <FinanceInput
        label="Turnover"
        labelAdornment
        name="turnover"
        register={register}
        errors={{}}
        handleChange={handleChange}
        handleBlur={handleBlur}
        adornmentWidth="80px"
      />,
    );

    const adornment = screen.getByTestId('input-adornment');
    expect(adornment).toHaveAttribute('data-position', 'start');
    expect(adornment).toHaveTextContent('Turnover');

    const input = screen.getByRole('textbox');
    await user.type(input, '123');
    expect(handleChange).toHaveBeenCalled();

    await user.tab();
    expect(handleBlur).toHaveBeenCalled();
  });
});
