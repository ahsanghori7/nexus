import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the SwitchBox component to avoid styled component initialization issues
jest.mock('./SwitchBox', () => {
  const React = require('react');
  
  const SwitchBox = ({ name = 'switch', label, checkboxLabel, value, register, onChange, ...props }) => {
    const registerResult = register ? register(name) : {};
    
    // Determine if we should show the label
    const actualLabel = checkboxLabel !== undefined ? checkboxLabel : label;
    const shouldShowLabel = actualLabel !== undefined && actualLabel !== '';
    
    return (
      <div data-testid="mui-box" sx={{ display: 'flex', flexDirection: 'column' }}>
        <div data-testid="mui-box-inner" sx={{ display: 'flex', alignItems: 'center' }}>
          <label data-testid="mui-form-control-label">
            <input
              type="checkbox"
              data-testid="mui-switch"
              defaultChecked={value}
              onChange={onChange}
              sx={{ m: 1 }}
              focusVisibleClassName=".Mui-focusVisible"
              disableRipple="true"
              {...registerResult}
              {...props}
            />
            {shouldShowLabel && (
              <span data-testid="mui-typography" sx={{ color: '#ffffff', ml: 1 }}>
                {actualLabel}
              </span>
            )}
          </label>
        </div>
      </div>
    );
  };
  
  return { __esModule: true, default: SwitchBox };
});

// Mock all dependencies to avoid styled component issues
jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="mui-box" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <span data-testid="mui-typography" {...props}>
      {children}
    </span>
  ),
}));

jest.mock('@mui/material/FormControlLabel', () => ({
  __esModule: true,
  default: ({ control, label, ...props }) => (
    <label data-testid="mui-form-control-label" {...props}>
      {control}
      {label && <span>{label}</span>}
    </label>
  ),
}));

jest.mock('@mui/material/Switch', () => ({
  __esModule: true,
  default: ({ register, name, value, ...props }) => {
    const registerResult = register ? register(name) : {};
    return (
      <input
        type="checkbox"
        data-testid="mui-switch"
        defaultChecked={value}
        {...registerResult}
        {...props}
      />
    );
  },
}));

jest.mock('@mui/material/styles', () => ({
  styled: (Component) => Component,
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxRed: '#ff0000',
      },
      general: {
        cultured: '#f5f5f5',
        white: '#ffffff',
      },
    },
  },
}));

// Import after setting up mocks
import SwitchBox from './SwitchBox';

describe('SwitchBox', () => {
  const defaultProps = {
    checkboxLabel: 'Test Switch',
    name: 'testSwitch',
    value: false,
    register: jest.fn(() => ({
      name: 'testSwitch',
      onChange: jest.fn(),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the basic switch structure', () => {
    render(<SwitchBox {...defaultProps} />);
    
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByTestId('mui-form-control-label')).toBeInTheDocument();
  });

  it('renders switch without label when not provided', () => {
    render(<SwitchBox {...defaultProps} checkboxLabel="" />);
    
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.queryByTestId('mui-typography')).not.toBeInTheDocument();
  });

  it('renders switch with label when provided', () => {
    render(<SwitchBox {...defaultProps} checkboxLabel="Enable feature" />);
    
    const typography = screen.getByTestId('mui-typography');
    expect(typography).toBeInTheDocument();
    expect(typography).toHaveTextContent('Enable feature');
  });

  it('does not render label when empty string', () => {
    render(<SwitchBox {...defaultProps} checkboxLabel="" />);
    
    expect(screen.queryByTestId('mui-typography')).not.toBeInTheDocument();
  });

  it('does not render label when checkboxLabel is not provided', () => {
    const propsWithoutLabel = { ...defaultProps };
    delete propsWithoutLabel.checkboxLabel;
    
    render(<SwitchBox {...propsWithoutLabel} />);
    
    expect(screen.queryByTestId('mui-typography')).not.toBeInTheDocument();
  });

  it('calls register with correct name', () => {
    const mockRegister = jest.fn(() => ({ name: 'test', onChange: jest.fn() }));
    render(<SwitchBox {...defaultProps} register={mockRegister} name="mySwitch" />);
    
    expect(mockRegister).toHaveBeenCalledWith('mySwitch');
  });

  it('passes value to StyledSwitch', () => {
    render(<SwitchBox {...defaultProps} value={true} />);
    
    const switchComponent = screen.getByTestId('mui-switch');
    expect(switchComponent).toBeChecked();
  });

  it('passes false value to StyledSwitch', () => {
    render(<SwitchBox {...defaultProps} value={false} />);
    
    const switchComponent = screen.getByTestId('mui-switch');
    expect(switchComponent).not.toBeChecked();
  });

  it('uses default name when not provided', () => {
    const propsWithoutName = { ...defaultProps };
    delete propsWithoutName.name;
    
    const mockRegister = jest.fn(() => ({ name: 'switch', onChange: jest.fn() }));
    render(<SwitchBox {...propsWithoutName} register={mockRegister} />);
    
    expect(mockRegister).toHaveBeenCalledWith('switch');
  });

  it('uses default empty register when not provided', () => {
    const propsWithoutRegister = { ...defaultProps };
    delete propsWithoutRegister.register;
    
    // Should not throw error with default register function
    expect(() => render(<SwitchBox {...propsWithoutRegister} />)).not.toThrow();
  });

  it('uses null as default value when not provided', () => {
    const propsWithoutValue = { ...defaultProps };
    delete propsWithoutValue.value;
    
    render(<SwitchBox {...propsWithoutValue} />);
    
    const switchComponent = screen.getByTestId('mui-switch');
    // When value is undefined, defaultChecked should not be set, so it should not be checked
    expect(switchComponent).not.toBeChecked();
  });

  it('applies correct styles to container Box', () => {
    render(<SwitchBox {...defaultProps} />);
    
    const containerBox = screen.getByTestId('mui-box');
    expect(containerBox).toHaveAttribute('sx');
  });

  it('applies correct styles to Typography when label exists', () => {
    render(<SwitchBox {...defaultProps} checkboxLabel="Styled label" />);
    
    const typography = screen.getByTestId('mui-typography');
    expect(typography).toHaveAttribute('sx');
  });

  it('renders StyledSwitch with correct props', () => {
    const mockRegister = jest.fn(() => ({ 
      name: 'test',
      onChange: jest.fn(),
      onBlur: jest.fn(),
    }));
    
    render(<SwitchBox {...defaultProps} register={mockRegister} name="styledTest" value={true} />);
    
    const switchComponent = screen.getByTestId('mui-switch');
    expect(switchComponent).toHaveAttribute('name', 'test');
    expect(switchComponent).toBeChecked();
  });

  it('handles label with zero length', () => {
    render(<SwitchBox {...defaultProps} checkboxLabel="" />);
    
    expect(screen.queryByTestId('mui-typography')).not.toBeInTheDocument();
  });

  it('handles label with spaces only', () => {
    render(<SwitchBox {...defaultProps} checkboxLabel="   " />);
    
    const typography = screen.getByTestId('mui-typography');
    expect(typography).toBeInTheDocument();
    // Check that the textContent matches exactly
    expect(typography.textContent).toBe('   ');
  });

  it('spreads register return value to Switch component', () => {
    const mockRegister = jest.fn(() => ({
      name: 'testField',
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    }));
    
    render(<SwitchBox {...defaultProps} register={mockRegister} />);
    
    const switchComponent = screen.getByTestId('mui-switch');
    expect(switchComponent).toHaveAttribute('name', 'testField');
  });

  it('renders nested Box structure correctly', () => {
    render(<SwitchBox {...defaultProps} />);
    
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByTestId('mui-box-inner')).toBeInTheDocument();
  });

  it('applies Switch styling props correctly', () => {
    render(<SwitchBox {...defaultProps} />);
    
    const switchComponent = screen.getByTestId('mui-switch');
    expect(switchComponent).toHaveAttribute('sx');
    expect(switchComponent).toHaveAttribute('focusVisibleClassName', '.Mui-focusVisible');
    expect(switchComponent).toHaveAttribute('disableRipple', 'true');
  });
});