import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientInformation from 'v2/apps/clink/pages/pmp/project-details/client-information';

var mockSearch;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('v2/apps/clink/pages/pmp/project-details/site-constraints', () => {
  const React = require('react');
  mockSearch = jest.fn();
  const Search = (props) => {
    mockSearch(props);
    return React.createElement(
      'div',
      { 'data-testid': 'mock-search' },
      'Search Component',
    );
  };

  return {
    __esModule: true,
    default: jest.fn(),
    Search,
  };
});

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

const buildUseUpdate = () => {
  const setClientRegNumber = jest.fn();
  const setClientName = jest.fn();
  const setClientAddressOne = jest.fn();
  const setClientAddressTwo = jest.fn();
  const setClientCity = jest.fn();
  const setClientPostcode = jest.fn();
  const setContactName = jest.fn();
  const setContactEmail = jest.fn();
  const setContactPostal = jest.fn();

  return {
    useUpdate: {
      useClientRegNumber: ['REG123', setClientRegNumber],
      useClientName: ['Acme Ltd', setClientName],
      useErrorsThree: [[]],
      useClientAddressOne: ['10 Downing St', setClientAddressOne],
      useClientAddressTwo: ['Westminster', setClientAddressTwo],
      useClientCity: ['London', setClientCity],
      useClientPostcode: ['SW1A 2AA', setClientPostcode],
      useClientContactName: ['John Doe', setContactName],
      useClientContactEmail: ['john@example.com', setContactEmail],
      useClientContactPostalCode: ['Postal', setContactPostal],
    },
    setters: {
      setClientRegNumber,
      setClientName,
      setClientAddressOne,
      setClientAddressTwo,
      setClientCity,
      setClientPostcode,
      setContactName,
      setContactEmail,
      setContactPostal,
    },
  };
};

describe('ClientInformation', () => {
  beforeEach(() => {
    mockSearch.mockClear();
  });

  it('renders postcode search by default and toggles to manual address', () => {
    const { useUpdate } = buildUseUpdate();

    render(<ClientInformation useUpdate={useUpdate} isUk />);

    expect(screen.getByTestId('mock-search')).toBeInTheDocument();
    expect(mockSearch).toHaveBeenCalledTimes(1);
    const searchProps = mockSearch.mock.calls[0][0];
    expect(searchProps.client).toBe(true);
    expect(searchProps.useUpdateProject).toEqual(
      expect.objectContaining({
        useClientName: useUpdate.useClientName,
        useErrorsOne: useUpdate.useErrorsThree,
      }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'enter-address-manually' }),
    );

    expect(screen.getByText('client-details')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-search')).not.toBeInTheDocument();
  });

  it('updates client contact information and validates email format', () => {
    const { useUpdate, setters } = buildUseUpdate();

    render(<ClientInformation useUpdate={useUpdate} isUk={false} />);

    fireEvent.change(screen.getByLabelText('name'), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByLabelText('postal-code'), {
      target: { value: 'NEW CODE' },
    });

    expect(setters.setContactName).toHaveBeenCalledWith('Jane Smith');
    expect(setters.setContactEmail).toHaveBeenCalledWith('not-an-email');
    expect(setters.setContactPostal).toHaveBeenCalledWith('NEW CODE');

    expect(screen.getByText('invalid-email')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'valid@example.com' },
    });

    expect(setters.setContactEmail).toHaveBeenCalledWith('valid@example.com');
    expect(screen.queryByText('invalid-email')).not.toBeInTheDocument();
  });
});
