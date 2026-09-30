import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectTender from './SelectTender';
import { useContext as useClinkContext } from 'hooks/context';

jest.mock('react-redux', () => ({
  connect: () => (Component) => (props) => <Component {...props} />,
}));

jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

jest.mock('v1/global/helpers/constants', () => ({
  TA_LABEL: 'TENDER_ADDENDUM',
}));

jest.mock('@mui/material/FormControl', () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="form-control" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@mui/material/Select', () => ({
  __esModule: true,
  default: ({ children, value, onChange, disabled }) => (
    <select
      data-testid="template-select"
      value={value}
      onChange={(event) => onChange?.({ target: { value: event.target.value } })}
      disabled={disabled}
    >
      {children}
    </select>
  ),
}));

jest.mock('@mui/material/MenuItem', () => ({
  __esModule: true,
  default: ({ children, value }) => (
    <option value={value}>{children}</option>
  ),
}));

const setSelectedTemplateMock = jest.fn();
const getTemplatesMock = jest.fn();

describe('SelectTender', () => {
  const baseTemplates = [
    {
      id: 'template-general',
      name: 'General',
      tender: 'Tender A',
      created_at: '2023-05-10T00:00:00Z',
    },
    {
      id: 'template-addendum-a',
      name: 'TENDER_ADDENDUM',
      tender: 'Tender B',
      created_at: '2023-05-11T00:00:00Z',
    },
  ];

  const renderComponent = (overrideProps = {}) => {
    const props = {
      templates: baseTemplates,
      selectedTemplate: 'template-general',
      did: 'template-default',
      open: {},
      dispatch: jest.fn(),
      ...overrideProps,
    };

    render(<SelectTender {...props} />);
    return props;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    setSelectedTemplateMock.mockImplementation((value) => ({
      type: 'SET_SELECTED_TEMPLATE',
      payload: value,
    }));

    useClinkContext.mockReturnValue({
      actions: {
        setSelectedTemplate: setSelectedTemplateMock,
        getTemplates: getTemplatesMock,
      },
    });
  });

  it('renders available templates and filters out tender addendum when closed', () => {
    renderComponent();

    expect(screen.getByTestId('template-select')).not.toBeDisabled();
    expect(
      screen.getByRole('option', {
        name: 'Tender A - General - 10/05/2023',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', {
        name: /Tender B - TENDER_ADDENDUM -/,
      }),
    ).not.toBeInTheDocument();
  });

  it('shows tender addendum templates when addendum modal open and dispatches on change', async () => {
    const templates = [
      {
        id: 'template-addendum-a',
        name: 'TENDER_ADDENDUM',
        tender: 'Addendum A',
        created_at: '2023-05-11T00:00:00Z',
      },
      {
        id: 'template-addendum-b',
        name: 'TENDER_ADDENDUM',
        tender: 'Addendum B',
        created_at: '',
      },
    ];

    const props = renderComponent({
      templates,
      open: { tenderAddendum: true },
      selectedTemplate: 'template-addendum-a',
    });

    const select = screen.getByTestId('template-select');
    const user = userEvent.setup();

    expect(
      screen.getByRole('option', {
        name: 'Addendum A - TENDER_ADDENDUM - 11/05/2023',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', {
        name: 'Addendum B - TENDER_ADDENDUM',
      }),
    ).toBeInTheDocument();

    await user.selectOptions(select, 'template-addendum-b');

    expect(setSelectedTemplateMock).toHaveBeenCalledWith('template-addendum-b');
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_SELECTED_TEMPLATE',
      payload: 'template-addendum-b',
    });
  });
});
