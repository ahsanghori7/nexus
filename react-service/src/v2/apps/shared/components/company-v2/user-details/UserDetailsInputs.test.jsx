import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserDetailsInputs from './UserDetailsInputs';

// Mock the company-details inputs
jest.mock('../company-details/inputs', () => ({
  CompanyFirstName: ({ register, errors, value }) => (
    <div data-testid="company-first-name">
      FirstName - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  CompanyLastName: ({ register, errors, value }) => (
    <div data-testid="company-last-name">
      LastName - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  UserEmail: ({ register, errors, value }) => (
    <div data-testid="user-email">
      Email - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
  CompanyJobDescription: ({ register, errors, value }) => (
    <div data-testid="company-job-description">
      JobDescription - register: {String(!!register)}, errors: {String(!!errors)}, value: {String(!!value)}
    </div>
  ),
}));

describe('UserDetailsInputs', () => {
  const mockData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    jobDescription: 'Software Developer',
  };

  const mockRegister = jest.fn();
  const mockErrors = { firstName: 'Required field' };

  it('renders without crashing', () => {
    render(
      <UserDetailsInputs
        data={mockData}
        register={mockRegister}
        errors={mockErrors}
      />
    );
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('renders all input components', () => {
    render(
      <UserDetailsInputs
        data={mockData}
        register={mockRegister}
        errors={mockErrors}
      />
    );

    expect(screen.getByTestId('company-job-description')).toBeInTheDocument();
    expect(screen.getByTestId('company-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('company-last-name')).toBeInTheDocument();
    expect(screen.getByTestId('user-email')).toBeInTheDocument();
  });

  it('passes props correctly to all input components', () => {
    render(
      <UserDetailsInputs
        data={mockData}
        register={mockRegister}
        errors={mockErrors}
      />
    );

    // Check that register, errors, and value are passed to each component
    expect(screen.getByText(/FirstName - register: true, errors: true, value: true/)).toBeInTheDocument();
    expect(screen.getByText(/LastName - register: true, errors: true, value: true/)).toBeInTheDocument();
    expect(screen.getByText(/Email - register: true, errors: true, value: true/)).toBeInTheDocument();
    expect(screen.getByText(/JobDescription - register: true, errors: true, value: true/)).toBeInTheDocument();
  });

  it('renders when data is null', () => {
    render(
      <UserDetailsInputs
        data={null}
        register={mockRegister}
        errors={mockErrors}
      />
    );

    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByText(/FirstName - register: true, errors: true, value: false/)).toBeInTheDocument();
  });

  it('renders when register is null', () => {
    render(
      <UserDetailsInputs
        data={mockData}
        register={null}
        errors={mockErrors}
      />
    );

    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByText(/FirstName - register: false, errors: true, value: true/)).toBeInTheDocument();
  });

  it('renders when errors is null', () => {
    render(
      <UserDetailsInputs
        data={mockData}
        register={mockRegister}
        errors={null}
      />
    );

    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByText(/FirstName - register: true, errors: false, value: true/)).toBeInTheDocument();
  });

  it('renders with all props as null', () => {
    render(
      <UserDetailsInputs
        data={null}
        register={null}
        errors={null}
      />
    );

    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByText(/FirstName - register: false, errors: false, value: false/)).toBeInTheDocument();
  });
});