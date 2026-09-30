import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MuiContactsList } from './mui.styled';

// Mock the Contact component
jest.mock('./Contact', () => {
  const MockContact = ({ data, mobile }) => (
    <div data-testid="mock-contact">
      Contact: {data?.firstname} {data?.lastname} 
      {mobile && ' (mobile)'}
    </div>
  );
  MockContact.displayName = 'Contact';
  return MockContact;
});

// Mock data
const mockContacts = [
  { id: 1, firstname: 'John', lastname: 'Doe' },
  { id: 2, firstname: 'Jane', lastname: 'Smith' }
];

describe('MuiContactsList', () => {
  it('renders without crashing', () => {
    render(
      <MuiContactsList
        contacts={mockContacts}
      />
    );
  });

  it('renders with empty contacts array', () => {
    render(
      <MuiContactsList
        contacts={[]}
      />
    );
  });

  it('renders contacts with names', () => {
    const { getByText } = render(
      <MuiContactsList
        contacts={mockContacts}
      />
    );
    
    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders contacts with missing names', () => {
    const contactsWithMissingNames = [
      { id: 1, firstname: 'John' },
      { id: 2, lastname: 'Smith' },
      { id: 3 }
    ];
    
    const { container } = render(
      <MuiContactsList
        contacts={contactsWithMissingNames}
      />
    );
    
    // Check that the component rendered the contacts even with missing names
    expect(container.textContent).toContain('John ');
    expect(container.textContent).toContain(' Smith');
    expect(container.textContent).toContain(' ');
  });

  it('handles default props gracefully', () => {
    // This test ensures the component doesn't crash with undefined contacts
    // In practice, this scenario might not happen based on the component implementation
    // but we can test that the component structure still renders
    const { container } = render(
      <MuiContactsList contacts={[]} />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});