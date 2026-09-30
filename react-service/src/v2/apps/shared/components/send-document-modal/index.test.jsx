import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SendDocumentModal from 'v2/apps/shared/components/send-document-modal';
import { useContext } from 'hooks/context';
import { getProjectUrl } from 'v2/helpers/url';
import DocController from 'v1/global/services/documents/DocumentCreatorSend';
import { analytics } from 'v1/global/helpers/services';
import useMediaQuery from '@mui/material/useMediaQuery';

jest.mock('react-redux', () => ({
  connect: () => (Component) => Component,
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('v2/helpers/url', () => ({
  getProjectUrl: jest.fn(() => 'mock-url'),
}));

jest.mock('v1/global/services/documents/DocumentCreatorSend', () => jest.fn());

jest.mock('v1/global/helpers/services', () => ({
  analytics: jest.fn(),
}));

jest.mock('@mui/material/useMediaQuery', () => jest.fn(() => false));

jest.mock('@mui/material/styles', () => {
  const actual = jest.requireActual('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      breakpoints: {
        down: () => '(max-width:960px)',
      },
    }),
  };
});

jest.mock(
  'v2/apps/shared/components/send-document-modal/Contacts',
  () =>
    function Contacts({ subcontractor }) {
      return (
        <div data-testid="contact-row">
          {subcontractor?.name || subcontractor?.id || subcontractor?.sub_id}
        </div>
      );
    },
);

jest.mock(
  'v2/apps/shared/components/send-document-modal/SelectTender',
  () =>
    function SelectTenderMock({ did }) {
      return <div data-testid="select-tender">selected:{did}</div>;
    },
);

const createActions = () => ({
  fetchTenderTemplates: jest.fn((payload) => ({
    type: 'FETCH_TEMPLATES',
    payload,
  })),
  setOpenContactsModal: jest.fn((value) => ({
    type: 'SET_OPEN_CONTACTS',
    payload: value,
  })),
  setTenderTemplates: jest.fn((value) => ({
    type: 'SET_TEMPLATES',
    payload: value,
  })),
  setSelectedTemplate: jest.fn((value) => ({
    type: 'SET_SELECTED_TEMPLATE',
    payload: value,
  })),
  setContacts: jest.fn((value) => ({
    type: 'SET_CONTACTS',
    payload: value,
  })),
});

const renderComponent = (overrideProps = {}) => {
  const actions = createActions();
  useContext.mockReturnValue({ actions });

  const dispatch = jest.fn();
  const callback = jest.fn();
  const handleSend = jest.fn();

  const props = {
    loading: false,
    templates: [],
    contacts: {},
    open: {
      pid: 1,
      tid: 2,
      subcontractors: [],
    },
    slug: 'project-slug',
    dispatch,
    orders: false,
    did: 0,
    selectedTemplate: 0,
    callback,
    handleSend,
    ...overrideProps,
  };

  render(
    <MemoryRouter>
      <SendDocumentModal {...props} />
    </MemoryRouter>,
  );

  return {
    actions,
    dispatch,
    callback,
    handleSend,
    props,
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  useMediaQuery.mockReturnValue(false);
});

test('requests tender templates and renders fallback when none are available', async () => {
  const { actions, dispatch } = renderComponent({
    templates: [],
    open: { pid: 11, tid: 22 },
  });

  await waitFor(() =>
    expect(actions.fetchTenderTemplates).toHaveBeenCalledWith({
      pid: 11,
      tid: 22,
      status: 1,
      approval_status: 'Approved',
    }),
  );

  expect(dispatch).toHaveBeenCalledWith({
    type: 'FETCH_TEMPLATES',
    payload: { pid: 11, tid: 22, status: 1, approval_status: 'Approved' },
  });
  expect(getProjectUrl).toHaveBeenCalledWith('project-slug', 'issue_enquiry', {
    tid: 22,
  });
  expect(screen.getByText('no-documents-available-td')).toBeInTheDocument();

  const user = userEvent.setup();
  await user.click(screen.getByText('close'));

  expect(actions.setOpenContactsModal).toHaveBeenCalledWith(false);
  expect(actions.setTenderTemplates).toHaveBeenCalledWith([]);
  expect(actions.setSelectedTemplate).toHaveBeenCalledWith(0);
  expect(actions.setContacts).toHaveBeenCalledWith({});
});

test('orders flow sends selected account ids to handleSend', async () => {
  const contacts = {
    first: [
      { id: 1, account_id: 101, selected: true },
      { id: 2, account_id: 202, selected: false },
    ],
    second: [{ id: 3, account_id: 303, selected: true }],
  };

  const { handleSend } = renderComponent({
    orders: true,
    templates: [{ id: 900, name: 'OrderTemplate' }],
    contacts,
    open: {
      subcontractors: [
        { id: 'sub-1', name: 'One' },
        { id: 'sub-2', name: 'Two' },
      ],
    },
  });

  const [, sendButton] = await screen.findAllByText('send-order');
  expect(sendButton).not.toBeDisabled();

  const user = userEvent.setup();
  await user.click(sendButton);

  expect(handleSend).toHaveBeenCalledWith([101, 303]);
  expect(DocController).not.toHaveBeenCalled();
  expect(screen.getAllByTestId('contact-row')).toHaveLength(2);
});

test('enquiry flow triggers success path and closes the modal', async () => {
  DocController.mockImplementation((_body, onSuccess) => {
    onSuccess();
  });

  const contacts = {
    only: [{ id: 5, account_id: 500, selected: true }],
  };

  const { actions, dispatch, callback } = renderComponent({
    templates: [{ id: 777, name: 'General' }],
    contacts,
    did: 123,
    selectedTemplate: 456,
    open: {
      pid: 1,
      tid: 88,
      subcontractors: {
        a: { id: 'sub-a', name: 'Alpha' },
        b: { sub_id: 'sub-b', name: 'Beta' },
      },
    },
  });

  const [, sendButton] = await screen.findAllByText('send-enquiry');
  const user = userEvent.setup();
  await user.click(sendButton);

  expect(DocController).toHaveBeenCalledTimes(1);
  const [payloadString, successCallback] = DocController.mock.calls[0];
  expect(typeof successCallback).toBe('function');
  expect(JSON.parse(payloadString)).toEqual({
    sids: [500],
    suids: [5],
    did: 456, // selectedTemplate takes priority over did prop when user manually selects
    tid: 88,
  });

  expect(callback).toHaveBeenCalled();
  expect(analytics).toHaveBeenCalledWith('history.enquiry.sent', 500);

  await waitFor(() =>
    expect(screen.getByText('enquiry-sent-success-msg')).toBeInTheDocument(),
  );

  expect(actions.setOpenContactsModal).toHaveBeenCalledWith(false);
  expect(actions.setTenderTemplates).toHaveBeenCalledWith([]);
  expect(actions.setSelectedTemplate).toHaveBeenCalledWith(0);
  expect(actions.setContacts).toHaveBeenCalledWith({});

  expect(dispatch).toHaveBeenCalledWith({
    type: 'SET_OPEN_CONTACTS',
    payload: false,
  });
});

test('enquiry flow shows error snackbar when DocController fails', async () => {
  DocController.mockImplementation((_body, _onSuccess, onError) => {
    onError();
  });

  const contacts = {
    main: [{ id: 10, account_id: 200, selected: true }],
  };

  const { actions } = renderComponent({
    templates: [{ id: 1, name: 'General' }],
    contacts,
    open: { pid: 4, tid: 5, subcontractors: [] },
    did: 12,
  });

  const [, sendButton] = await screen.findAllByText('send-enquiry');
  const user = userEvent.setup();
  await user.click(sendButton);

  await waitFor(() => expect(screen.getByText('oops')).toBeInTheDocument());
  expect(actions.setOpenContactsModal).toHaveBeenCalledWith(false);
});

test('renders Send Tender Addendum title when open.tenderAddendum is true', async () => {
  renderComponent({
    templates: [{ id: 1, name: 'Tender Addendum' }],
    open: {
      pid: 1,
      tid: 2,
      tenderAddendum: true,
      subcontractors: [],
    },
  });

  const [, titleEl] = await screen.findAllByText('send-tender-addendum');
  expect(titleEl).toBeInTheDocument();

  expect(screen.queryByText('send-enquiry')).not.toBeInTheDocument();
});

test('enquiry flow shows backend message for 429 errors', async () => {
  const rateLimitMessage =
    'An Enquiry was already sent for this package less than 5 minutes ago. Please wait before sending again.';

  DocController.mockImplementation((_body, _onSuccess, onError) => {
    onError({
      status: 429,
      message: rateLimitMessage,
    });
  });

  const contacts = {
    main: [{ id: 10, account_id: 200, selected: true }],
  };

  renderComponent({
    templates: [{ id: 1, name: 'General' }],
    contacts,
    open: { pid: 4, tid: 5, subcontractors: [] },
    did: 12,
  });

  const [, sendButton] = await screen.findAllByText('send-enquiry');
  const user = userEvent.setup();
  await user.click(sendButton);

  await waitFor(() => expect(screen.getByText(rateLimitMessage)).toBeInTheDocument());
});
