import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SiteDetails from 'v2/apps/clink/pages/pmp/project-details/site-constraints';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

describe('SiteDetails', () => {
  const createMocks = () => {
    const setAddressOne = jest.fn();
    const setAddressTwo = jest.fn();
    const setCity = jest.fn();
    const setPostcode = jest.fn();

    const useUpdateProject = {
      useAddressOne: ['10 Downing St', setAddressOne],
      useAddressTwo: ['Westminster', setAddressTwo],
      useCity: ['London', setCity],
      usePostcode: ['SW1A 2AA', setPostcode],
      useErrorsOne: [[]],
    };

    return {
      useUpdateProject,
      setAddressOne,
      setAddressTwo,
      setCity,
      setPostcode,
    };
  };

  it('renders site details header and fields', () => {
    const { useUpdateProject } = createMocks();

    render(<SiteDetails useUpdateProject={useUpdateProject} />);

    expect(screen.getByText('site-details')).toBeInTheDocument();
    expect(screen.getByLabelText(/address-line-1/i)).toHaveValue(
      '10 Downing St',
    );
    expect(screen.getByLabelText(/address-line-2/i)).toHaveValue('Westminster');
    expect(screen.getByLabelText(/city/i)).toHaveValue('London');
    expect(screen.getByLabelText(/postcode/i)).toHaveValue('SW1A 2AA');
  });

  it('propagates user input to setters', () => {
    const {
      useUpdateProject,
      setAddressOne,
      setAddressTwo,
      setCity,
      setPostcode,
    } = createMocks();

    render(<SiteDetails useUpdateProject={useUpdateProject} />);

    fireEvent.change(screen.getByLabelText(/address-line-1/i), {
      target: { value: '221B Baker St' },
    });
    fireEvent.change(screen.getByLabelText(/address-line-2/i), {
      target: { value: 'Marylebone' },
    });
    fireEvent.change(screen.getByLabelText(/city/i), {
      target: { value: 'London City' },
    });
    fireEvent.change(screen.getByLabelText(/postcode/i), {
      target: { value: 'NW1 6XE' },
    });

    expect(setAddressOne).toHaveBeenCalledWith('221B Baker St');
    expect(setAddressTwo).toHaveBeenCalledWith('Marylebone');
    expect(setCity).toHaveBeenCalledWith('London City');
    expect(setPostcode).toHaveBeenCalledWith('NW1 6XE');
  });
});
