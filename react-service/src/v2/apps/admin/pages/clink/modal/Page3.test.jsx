import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page3 from './Page3';

// Mock the styled components
jest.mock('./Modal.styled', () => ({
  Container: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'styled-container' }, children);
  },
  StyledItemAutocomplete: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'styled-item-autocomplete' }, children);
  },
  PageTitle: ({ children }) => {
    const React = require('react');
    return React.createElement('h2', { 'data-testid': 'page-title' }, children);
  },
}));

describe('Page3 Component', () => {
  const defaultProps = {
    errors: {},
    register: jest.fn(() => ({ name: 'subscription_id', onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() })),
    setValue: jest.fn(),
    control: {},
    trigger: jest.fn(),
    subscriptionsList: [
      { id: 1, label: 'Basic Plan - (monthly)', name: 'Basic Plan' },
      { id: 2, label: 'Premium Plan - (annual)', name: 'Premium Plan' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page3 {...defaultProps} />);
    
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
    expect(screen.getByTestId('styled-container')).toBeInTheDocument();
  });

  it('displays the correct page title', () => {
    render(<Page3 {...defaultProps} />);
    
    const pageTitle = screen.getByTestId('page-title');
    expect(pageTitle).toHaveTextContent('membership_options');
  });

  it('renders the subscription select input', () => {
    render(<Page3 {...defaultProps} />);
    
    const selectInput = screen.getByTestId('modal-input-subscription');
    expect(selectInput).toBeInTheDocument();
  });

  it('renders with default empty subscriptions list', () => {
    const propsWithEmptyList = {
      ...defaultProps,
      subscriptionsList: [],
    };
    
    render(<Page3 {...propsWithEmptyList} />);
    
    const select = screen.getByTestId('modal-input-subscription');
    expect(select).toBeInTheDocument();
    
    // Should only have the placeholder option
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Select from list');
  });

  it('renders subscription options correctly', () => {
    render(<Page3 {...defaultProps} />);
    
    const select = screen.getByTestId('modal-input-subscription');
    const options = select.querySelectorAll('option');
    
    // Should have placeholder + 2 subscription options
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Select from list');
    expect(options[1]).toHaveTextContent('Basic Plan - (monthly)');
    expect(options[2]).toHaveTextContent('Premium Plan - (annual)');
  });

  it('handles undefined subscriptionsList gracefully', () => {
    const propsWithUndefinedList = {
      ...defaultProps,
      subscriptionsList: undefined,
    };
    
    render(<Page3 {...propsWithUndefinedList} />);
    
    const select = screen.getByTestId('modal-input-subscription');
    expect(select).toBeInTheDocument();
    
    // Should only have the placeholder option
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(1);
  });

  it('passes correct props to InputFormControlled', () => {
    render(<Page3 {...defaultProps} />);
    
    const inputForm = screen.getByTestId('input-form-subscription_id');
    expect(inputForm).toBeInTheDocument();
    
    const select = screen.getByTestId('modal-input-subscription');
    expect(select).toHaveAttribute('name', 'subscription_id');
    expect(select).toHaveAttribute('id', 'subscription_id');
  });

  it('renders with StyledItemAutocomplete wrapper', () => {
    render(<Page3 {...defaultProps} />);
    
    expect(screen.getByTestId('styled-item-autocomplete')).toBeInTheDocument();
  });

  it('displays error message when errors exist', () => {
    const propsWithError = {
      ...defaultProps,
      errors: {
        subscription_id: { message: 'Subscription is required' }
      }
    };
    
    render(<Page3 {...propsWithError} />);
    
    const errorMessage = screen.getByTestId('error-subscription_id');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Subscription is required');
  });

  it('does not display error message when no errors', () => {
    render(<Page3 {...defaultProps} />);
    
    const errorMessage = screen.queryByTestId('error-subscription_id');
    expect(errorMessage).not.toBeInTheDocument();
  });
});