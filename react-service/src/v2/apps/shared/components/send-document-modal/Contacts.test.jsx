import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Contacts from './Contacts';
import { useContext as useClinkContext } from 'hooks/context';

jest.mock('react-redux', () => ({
  connect: () => (Component) => (props) => <Component {...props} />,
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

const selectContactMock = jest.fn();
const getContactsMock = jest.fn();

describe('Contacts', () => {
  const baseSubcontractor = {
    sub_id: 'sub-123',
    name: 'Acme Builders',
  };

  const baseContacts = {
    'sub-123': [
      {
        id: 'enabled-contact',
        name: 'Enabled Contact',
        email: 'enabled@example.com',
        status: 2,
        selected: true,
      },
      {
        id: 'disabled-contact',
        name: 'Disabled Contact',
        email: 'disabled@example.com',
        status: 1,
        selected: false,
      },
    ],
  };

  const renderComponent = (overrideProps = {}) => {
    const props = {
      subcontractor: baseSubcontractor,
      contacts: baseContacts,
      dispatch: jest.fn(),
      ...overrideProps,
    };

    render(<Contacts {...props} />);
    return props;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    selectContactMock.mockImplementation((payload) => ({
      type: 'SELECT_CONTACT',
      payload,
    }));

    getContactsMock.mockImplementation((subId) => ({
      type: 'GET_CONTACTS',
      payload: subId,
    }));

    useClinkContext.mockReturnValue({
      actions: {
        selectContact: selectContactMock,
        getContacts: getContactsMock,
      },
    });
  });

  it('renders the subcontractor contacts and fetches them on mount', async () => {
    // Render with empty contacts to trigger the API call
    const props = renderComponent({ contacts: {} });

    expect(screen.getByText('Acme Builders')).toBeInTheDocument();

    await waitFor(() => {
      expect(getContactsMock).toHaveBeenCalledWith('sub-123');
    });

    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'GET_CONTACTS',
      payload: 'sub-123',
    });
  });

  it('renders existing contacts without fetching when they already exist', () => {
    const props = renderComponent();

    expect(screen.getByText('Acme Builders')).toBeInTheDocument();
    expect(screen.getByText('enabled@example.com')).toBeInTheDocument();
    expect(screen.getByText('disabled@example.com')).toBeInTheDocument();

    // Should NOT call getContacts because contacts already exist
    expect(getContactsMock).not.toHaveBeenCalled();
    expect(props.dispatch).not.toHaveBeenCalled();
  });

  it('dispatches select when an enabled contact is clicked but ignores disabled contacts', async () => {
    const props = renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByText('Enabled Contact'));

    expect(selectContactMock).toHaveBeenCalledWith({
      subId: 'sub-123',
      contactId: 'enabled-contact',
    });

    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SELECT_CONTACT',
      payload: {
        subId: 'sub-123',
        contactId: 'enabled-contact',
      },
    });

    selectContactMock.mockClear();
    props.dispatch.mockClear();

    await user.click(screen.getByText('Disabled Contact'));

    expect(selectContactMock).not.toHaveBeenCalled();
    expect(props.dispatch).not.toHaveBeenCalled();
  });
});
