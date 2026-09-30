import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import Search from 'v2/apps/clink/pages/pmp/project-details/site-constraints/Search';

var mockAutocomplete;

jest.mock('@mui/material/Autocomplete', () => {
  const React = require('react');
  mockAutocomplete = jest.fn((props) => {
    const { renderInput } = props;
    return React.createElement(
      'div',
      { 'data-testid': 'autocomplete-mock' },
      renderInput
        ? renderInput({
            InputProps: {},
            inputProps: {},
            value: '',
            onChange: () => {},
          })
        : null,
    );
  });

  return (props) => mockAutocomplete(props);
});

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

const buildHooks = (overrides = {}) => {
  const setAddressOne = jest.fn();
  const setAddressTwo = jest.fn();
  const setCity = jest.fn();
  const setPostcode = jest.fn();
  const setClientName = jest.fn();
  const setClientRegNumber = jest.fn();

  return {
    useAddressOne: ['10 Downing St', setAddressOne],
    useAddressTwo: ['Westminster', setAddressTwo],
    useCity: ['London', setCity],
    usePostcode: ['SW1A 2AA', setPostcode],
    useErrorsOne: [[]],
    useClientName: ['Acme Ltd', setClientName],
    useClientRegNumber: ['REG123', setClientRegNumber],
    ...overrides,
    setters: {
      setAddressOne,
      setAddressTwo,
      setCity,
      setPostcode,
      setClientName,
      setClientRegNumber,
    },
  };
};

describe('Search component', () => {
  let originalFetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    mockAutocomplete.mockClear();
  });

  it('renders client fields and updates address details from fetched options', async () => {
    const {
      setters: { setAddressOne, setAddressTwo, setCity },
      ...hookValues
    } = buildHooks();

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        postcode: 'SW1A 2AA',
        addresses: [
          {
            line_1: 'Buckingham Palace',
            line_2: 'Westminster',
            town_or_city: 'London',
          },
        ],
      }),
    });

    render(<Search useUpdateProject={hookValues} client />);

    expect(screen.getByLabelText(/references-client_name/i)).toHaveValue('Acme Ltd');
    expect(screen.getByLabelText(/client-registration-number/i)).toHaveValue('REG123');

    const autocompleteProps = mockAutocomplete.mock.calls[0][0];
    await act(async () => {
      autocompleteProps.onOpen();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockAutocomplete.mock.calls[mockAutocomplete.mock.calls.length - 1][0].options).toHaveLength(1);
    });

    const latestProps = mockAutocomplete.mock.calls[mockAutocomplete.mock.calls.length - 1][0];
    const selectedOption = latestProps.options[0];

    latestProps.onChange?.(null, selectedOption);

    expect(setAddressOne).toHaveBeenCalledWith('Buckingham Palace');
    expect(setAddressTwo).toHaveBeenCalledWith('Westminster');
    expect(setCity).toHaveBeenCalledWith('London');
  });

  it('clears address details instead of crashing when the selection is cleared', async () => {
    const {
      setters: { setAddressOne, setAddressTwo, setCity },
      ...hookValues
    } = buildHooks();

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        postcode: 'SW1A 2AA',
        addresses: [
          {
            line_1: 'Buckingham Palace',
            line_2: 'Westminster',
            town_or_city: 'London',
          },
        ],
      }),
    });

    render(<Search useUpdateProject={hookValues} client />);

    const autocompleteProps = mockAutocomplete.mock.calls[0][0];
    await act(async () => {
      autocompleteProps.onOpen();
    });

    await waitFor(() => {
      expect(mockAutocomplete.mock.calls[mockAutocomplete.mock.calls.length - 1][0].options).toHaveLength(1);
    });

    const latestProps = mockAutocomplete.mock.calls[mockAutocomplete.mock.calls.length - 1][0];

    expect(() => latestProps.onChange?.(null, null)).not.toThrow();

    expect(setAddressOne).toHaveBeenCalledWith('');
    expect(setAddressTwo).toHaveBeenCalledWith('');
    expect(setCity).toHaveBeenCalledWith('');
  });

  it('does not trigger fetch when postcode is empty', () => {
    const hookValues = buildHooks({
      usePostcode: ['', jest.fn()],
    });

    global.fetch = jest.fn();

    render(<Search useUpdateProject={hookValues} />);

    const autocompleteProps = mockAutocomplete.mock.calls[0][0];
    autocompleteProps.onOpen();

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
