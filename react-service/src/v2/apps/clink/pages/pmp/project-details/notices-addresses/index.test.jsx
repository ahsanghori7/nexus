import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoticesAddresses from 'v2/apps/clink/pages/pmp/project-details/notices-addresses';

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

describe('NoticesAddresses', () => {
  const renderComponent = (override = {}) => {
    const setMainPostal = jest.fn();
    const setMainEmail = jest.fn();
    const setSubPostal = jest.fn();
    const setSubEmail = jest.fn();

    const useUpdateProject = {
      useMainContractorPostal: ['10 Downing St', setMainPostal],
      useMainContractorEmail: ['main@example.com', setMainEmail],
      useSubContractorPostal: ['221B Baker St', setSubPostal],
      useSubContractorEmail: ['sub@example.com', setSubEmail],
      ...override,
    };

    render(<NoticesAddresses useUpdateProject={useUpdateProject} />);

    return {
      setMainPostal,
      setMainEmail,
      setSubPostal,
      setSubEmail,
    };
  };

  it('renders both contractor sections with initial values', () => {
    renderComponent();

    expect(screen.getByText('main-contractor')).toBeInTheDocument();
    expect(screen.getByText('subcontractor')).toBeInTheDocument();
    expect(
      screen.getByLabelText('main-contractor-postal-address'),
    ).toHaveValue('10 Downing St');
    expect(
      screen.getByLabelText('subcontractor-postal-address'),
    ).toHaveValue('221B Baker St');
  });

  it('validates email fields and clears errors once valid', () => {
    const { setMainEmail, setSubEmail } = renderComponent();

    const mainEmail = screen.getByLabelText('main-contractor-email-address');
    const subEmail = screen.getByLabelText('subcontractor-email-address');

    fireEvent.change(mainEmail, { target: { value: 'invalid-email' } });
    fireEvent.change(subEmail, { target: { value: 'also-invalid' } });

    expect(setMainEmail).toHaveBeenCalledWith('invalid-email');
    expect(setSubEmail).toHaveBeenCalledWith('also-invalid');
    expect(screen.getAllByText('invalid-email')).toHaveLength(2);

    fireEvent.change(mainEmail, { target: { value: 'valid@domain.com' } });
    fireEvent.change(subEmail, { target: { value: 'team@domain.com' } });

    expect(screen.queryAllByText('invalid-email')).toHaveLength(0);
  });

  it('updates postal fields when user types', () => {
    const { setMainPostal, setSubPostal } = renderComponent();

    fireEvent.change(
      screen.getByLabelText('main-contractor-postal-address'),
      { target: { value: 'New Postal' } },
    );
    fireEvent.change(
      screen.getByLabelText('subcontractor-postal-address'),
      { target: { value: 'Sub Postal' } },
    );

    expect(setMainPostal).toHaveBeenCalledWith('New Postal');
    expect(setSubPostal).toHaveBeenCalledWith('Sub Postal');
  });
});
