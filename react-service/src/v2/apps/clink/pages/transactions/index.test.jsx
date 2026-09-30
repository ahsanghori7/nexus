import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TransactionsIssued from './index';

// Mock the Enquiry component
jest.mock('v2/apps/clink/pages/transactions/enquiry', () => {
  return function MockEnquiry({ project }) {
    return <div data-testid="enquiry-component">Enquiry with project: {project.id}</div>;
  };
});

describe('TransactionsIssued', () => {
  const createMockStore = (state) => {
    return configureStore({
      reducer: {
        project: (state = {}) => state
      },
      preloadedState: {
        project: state
      }
    });
  };

  it('renders loading state when loading is true', () => {
    const store = createMockStore({
      loading: true,
      data: null,
      error: null
    });

    render(
      <Provider store={store}>
        <TransactionsIssued />
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders loading state when project data has no id', () => {
    const store = createMockStore({
      loading: false,
      data: {},
      error: null
    });

    render(
      <Provider store={store}>
        <TransactionsIssued />
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state when there is an error', () => {
    const store = createMockStore({
      loading: false,
      data: { id: 123 }, // Need project data to pass the loading check
      error: 'Something went wrong'
    });

    render(
      <Provider store={store}>
        <TransactionsIssued />
      </Provider>
    );

    expect(screen.getByText('An error occurred while fetching the data')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders Enquiry component when project data is loaded', () => {
    const mockProject = {
      id: 123,
      name: 'Test Project'
    };

    const store = createMockStore({
      loading: false,
      data: mockProject,
      error: null
    });

    render(
      <Provider store={store}>
        <TransactionsIssued />
      </Provider>
    );

    expect(screen.getByTestId('enquiry-component')).toBeInTheDocument();
    expect(screen.getByText('Enquiry with project: 123')).toBeInTheDocument();
    expect(screen.getByTestId('mui-box')).toHaveAttribute('id', 'transaction-container');
  });

  it('renders with correct container id', () => {
    const mockProject = {
      id: 456,
      name: 'Another Test Project'
    };

    const store = createMockStore({
      loading: false,
      data: mockProject,
      error: null
    });

    render(
      <Provider store={store}>
        <TransactionsIssued />
      </Provider>
    );

    const container = screen.getByTestId('mui-box');
    expect(container).toHaveAttribute('id', 'transaction-container');
  });
});