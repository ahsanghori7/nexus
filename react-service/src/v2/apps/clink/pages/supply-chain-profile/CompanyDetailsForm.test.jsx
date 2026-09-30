import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyDetailsForm from './CompanyDetailsForm';

// Mock the external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('v2/helpers/url', () => ({
  checkIfImageExists: jest.fn((url, callback) => callback(false)),
}));

jest.mock('./contacts/mui.styled', () => ({
  MuiContactsList: ({ contacts }) => <div data-testid="contacts-list">{contacts?.length || 0} contacts</div>,
}));

describe('CompanyDetailsForm', () => {
  const mockProps = {
    details: {
      email: 'test@example.com',
      registered_address: '123 Test Street',
      mobile: '+1234567890',
      website: 'https://example.com',
    },
    logos: {
      company: 'https://example.com/logo.png',
    },
    members: [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Doe' },
    ],
  };

  it('renders without crashing', () => {
    const { container } = render(<CompanyDetailsForm {...mockProps} />);
    expect(container).toBeInTheDocument();
  });

  it('displays company email', () => {
    const { getByText } = render(<CompanyDetailsForm {...mockProps} />);
    expect(getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays company address', () => {
    const { getByText } = render(<CompanyDetailsForm {...mockProps} />);
    expect(getByText('123 Test Street')).toBeInTheDocument();
  });

  it('displays company phone', () => {
    const { getByText } = render(<CompanyDetailsForm {...mockProps} />);
    expect(getByText('+1234567890')).toBeInTheDocument();
  });

  it('displays website link', () => {
    const { getByText } = render(<CompanyDetailsForm {...mockProps} />);
    expect(getByText('https://example.com')).toBeInTheDocument();
  });

  it('renders contacts list', () => {
    const { getByTestId } = render(<CompanyDetailsForm {...mockProps} />);
    expect(getByTestId('contacts-list')).toBeInTheDocument();
    expect(getByTestId('contacts-list')).toHaveTextContent('2 contacts');
  });

  it('handles missing data gracefully', () => {
    const emptyProps = {
      details: {},
      logos: {},
      members: [],
    };
    const { container } = render(<CompanyDetailsForm {...emptyProps} />);
    expect(container).toBeInTheDocument();
  });
});