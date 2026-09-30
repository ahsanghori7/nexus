import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import i18next from 'v2/helpers/i18n';
import Address from 'v2/apps/clink/pages/pmp/project-details/client-information/Address';

jest.mock('clink-components');
jest.mock('v2/helpers/i18n');

beforeEach(() => {
  i18next.t = jest.fn((key) => key);
});

afterEach(() => {
  jest.clearAllMocks();
});

const createState = (value = '') => {
  const setter = jest.fn();
  return [value, setter];
};

const createUseUpdateProject = (overrides = {}) => ({
  useClientAddressOne: createState('10 Downing St'),
  useClientAddressTwo: createState(''),
  useClientCity: createState('London'),
  useClientPostcode: createState('SW1A 2AA'),
  useClientName: createState('Acme Ltd'),
  useClientRegNumber: createState('12345678'),
  useErrorsThree: [[]],
  ...overrides,
});

const renderComponent = (props = {}) => {
  const useUpdateProject = createUseUpdateProject(props.useUpdateProject);
  const renderResult = render(<Address useUpdateProject={useUpdateProject} />);
  return {
    ...renderResult,
    useUpdateProject,
  };
};

describe('Address', () => {
  it('renders the client details section with all fields', () => {
    renderComponent();

    expect(screen.getByText('client-details')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^references-client_name/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^client-registration-number/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^address-line-1/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^address-line-2/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^city/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^postcode/)).toBeInTheDocument();
  });

  it('calls the corresponding setter when a field value changes', () => {
    const { useUpdateProject } = renderComponent();
    const [, setClientName] = useUpdateProject.useClientName;
    const [, setClientPostcode] = useUpdateProject.useClientPostcode;

    fireEvent.change(screen.getByLabelText(/^references-client_name/), {
      target: { value: 'New Name' },
    });
    fireEvent.change(screen.getByLabelText(/^postcode/), {
      target: { value: 'SW1A 1AA' },
    });

    expect(setClientName).toHaveBeenCalledWith('New Name');
    expect(setClientPostcode).toHaveBeenCalledWith('SW1A 1AA');
  });
});
