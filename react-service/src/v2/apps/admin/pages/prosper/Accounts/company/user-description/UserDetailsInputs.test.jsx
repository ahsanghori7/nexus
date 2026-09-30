import React from 'react';
import { render, screen } from '@testing-library/react';
import UserDetailsInputs from 'v2/apps/admin/pages/prosper/Accounts/company/user-description/UserDetailsInputs';

// Mock MUI Box component
jest.mock('@mui/material/Box', () => ({ children, sx, ...props }) => (
  <div data-testid="mui-box" data-sx={JSON.stringify(sx)} {...props}>
    {children}
  </div>
));

// Mock the input components
jest.mock('../details/inputs', () => ({
  CompanyFirstName: ({ register, errors, value }) => (
    <div data-testid="company-first-name" data-register={!!register} data-errors={!!errors} data-value={!!value}>
      Company First Name Input
    </div>
  ),
  CompanyLastName: ({ register, errors, value }) => (
    <div data-testid="company-last-name" data-register={!!register} data-errors={!!errors} data-value={!!value}>
      Company Last Name Input
    </div>
  ),
  UserEmail: ({ register, errors, value }) => (
    <div data-testid="user-email" data-register={!!register} data-errors={!!errors} data-value={!!value}>
      User Email Input
    </div>
  ),
  CompanyJobDescription: ({ register, errors, value }) => (
    <div data-testid="company-job-description" data-register={!!register} data-errors={!!errors} data-value={!!value}>
      Company Job Description Input
    </div>
  ),
}));

describe('UserDetailsInputs', () => {
  const mockRegister = jest.fn();
  const mockErrors = { firstName: 'Required' };
  const mockData = { firstName: 'John', lastName: 'Doe' };

  const defaultProps = {
    data: mockData,
    register: mockRegister,
    errors: mockErrors,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<UserDetailsInputs {...defaultProps} />);

    expect(screen.getAllByTestId('mui-box')).toHaveLength(2);
  });

  it('should render all input components', () => {
    render(<UserDetailsInputs {...defaultProps} />);

    expect(screen.getByTestId('company-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('company-last-name')).toBeInTheDocument();
    expect(screen.getByTestId('user-email')).toBeInTheDocument();
    expect(screen.getByTestId('company-job-description')).toBeInTheDocument();
  });

  it('should pass props to all input components', () => {
    render(<UserDetailsInputs {...defaultProps} />);

    const inputs = [
      screen.getByTestId('company-first-name'),
      screen.getByTestId('company-last-name'),
      screen.getByTestId('user-email'),
      screen.getByTestId('company-job-description'),
    ];

    inputs.forEach(input => {
      expect(input).toHaveAttribute('data-register', 'true');
      expect(input).toHaveAttribute('data-errors', 'true');
      expect(input).toHaveAttribute('data-value', 'true');
    });
  });

  it('should render Box components with correct styles', () => {
    render(<UserDetailsInputs {...defaultProps} />);

    const boxes = screen.getAllByTestId('mui-box');
    
    boxes.forEach(box => {
      const sx = JSON.parse(box.getAttribute('data-sx'));
      expect(sx.display).toBe('flex');
      expect(sx.flexWrap).toEqual({ xs: 'wrap', md: 'nowrap' });
      expect(sx['& > .clink-form__input']).toBeDefined();
    });
  });

  it('should group inputs correctly in boxes', () => {
    render(<UserDetailsInputs {...defaultProps} />);

    const boxes = screen.getAllByTestId('mui-box');
    
    // First box should contain first name and last name
    const firstBoxChildren = Array.from(boxes[0].children);
    expect(firstBoxChildren).toHaveLength(2);
    expect(firstBoxChildren[0]).toHaveAttribute('data-testid', 'company-first-name');
    expect(firstBoxChildren[1]).toHaveAttribute('data-testid', 'company-last-name');

    // Second box should contain job description and email
    const secondBoxChildren = Array.from(boxes[1].children);
    expect(secondBoxChildren).toHaveLength(2);
    expect(secondBoxChildren[0]).toHaveAttribute('data-testid', 'company-job-description');
    expect(secondBoxChildren[1]).toHaveAttribute('data-testid', 'user-email');
  });

  it('should handle undefined props', () => {
    render(<UserDetailsInputs data={undefined} register={undefined} errors={undefined} />);

    const inputs = [
      screen.getByTestId('company-first-name'),
      screen.getByTestId('company-last-name'),
      screen.getByTestId('user-email'),
      screen.getByTestId('company-job-description'),
    ];

    inputs.forEach(input => {
      expect(input).toHaveAttribute('data-register', 'false');
      expect(input).toHaveAttribute('data-errors', 'false');
      expect(input).toHaveAttribute('data-value', 'false');
    });
  });

  it('should handle empty data object', () => {
    render(<UserDetailsInputs {...defaultProps} data={{}} />);

    expect(screen.getByTestId('company-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('company-last-name')).toBeInTheDocument();
    expect(screen.getByTestId('user-email')).toBeInTheDocument();
    expect(screen.getByTestId('company-job-description')).toBeInTheDocument();
  });

  it('should handle empty errors object', () => {
    render(<UserDetailsInputs {...defaultProps} errors={{}} />);

    const inputs = [
      screen.getByTestId('company-first-name'),
      screen.getByTestId('company-last-name'),
      screen.getByTestId('user-email'),
      screen.getByTestId('company-job-description'),
    ];

    inputs.forEach(input => {
      expect(input).toHaveAttribute('data-errors', 'true'); // Still truthy because {} is truthy
    });
  });
});