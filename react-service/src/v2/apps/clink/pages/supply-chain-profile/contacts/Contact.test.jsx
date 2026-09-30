import React from 'react';
import { render, screen } from '@testing-library/react';
import Contact from './Contact';

// Mock the url helper
jest.mock('v2/helpers/url', () => ({
  checkIfImageExists: jest.fn(),
}));

describe('Contact', () => {
  const mockData = {
    firstname: 'John',
    lastname: 'Doe',
    title: 'Project Manager',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    logo: 'http://example.com/logo.png',
  };

  beforeEach(() => {
    const { checkIfImageExists } = require('v2/helpers/url');
    checkIfImageExists.mockClear();
  });

  it('renders without crashing', () => {
    render(<Contact data={mockData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<Contact data={{}} />);
    
    expect(screen.getByTestId('mui-avatar')).toBeInTheDocument();
  });

  it('renders without data prop', () => {
    render(<Contact />);
    
    expect(screen.getByTestId('mui-avatar')).toBeInTheDocument();
  });

  it('renders in mobile mode', () => {
    render(<Contact data={mockData} mobile={true} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  it('renders long email with line break', () => {
    const longEmailData = {
      ...mockData,
      email: 'very.long.email.address@verylongdomainname.com',
    };
    
    render(<Contact data={longEmailData} />);
    
    expect(screen.getByText(/very.long.email.address/)).toBeInTheDocument();
    expect(screen.getByText(/@verylongdomainname.com/)).toBeInTheDocument();
  });

  it('renders contact without phone number', () => {
    const dataWithoutPhone = {
      firstname: 'Jane',
      lastname: 'Smith',
      title: 'Developer',
      email: 'jane.smith@example.com',
    };
    
    render(<Contact data={dataWithoutPhone} />);
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
  });

  it('renders contact without email', () => {
    const dataWithoutEmail = {
      firstname: 'Bob',
      lastname: 'Johnson',
      title: 'Designer',
      phone: '+9876543210',
    };
    
    render(<Contact data={dataWithoutEmail} />);
    
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('Designer')).toBeInTheDocument();
    expect(screen.getByText('+9876543210')).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it('renders with partial name data', () => {
    const partialData = {
      firstname: 'Alice',
      title: 'Manager',
    };
    
    render(<Contact data={partialData} />);
    
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

  it('calls checkIfImageExists on mount', () => {
    const { checkIfImageExists } = require('v2/helpers/url');
    checkIfImageExists.mockImplementation((url, callback) => {
      callback(true);
    });
    
    render(<Contact data={mockData} />);
    
    expect(checkIfImageExists).toHaveBeenCalledWith(
      mockData.logo,
      expect.any(Function)
    );
  });
});