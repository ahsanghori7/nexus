import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import FormInstruction from './index';

// Mock global variables
global.BASE_URLS = {
  CLINK: '/main-contractor',
  PROSPER: '/prosper',
};

// Mock all the dependencies
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: (mapStateToProps) => (Component) => {
    const ConnectedComponent = (props) => {
      // Default state
      const defaultState = {
        project: { data: null },
        instructions: { 
          data: null, 
          subcontractorsList: [], 
          status: null, 
          blocked: false, 
          sentSuccessfully: false 
        }
      };
      
      // Use overrides from props if provided
      const state = {
        ...defaultState,
        ...(props.testState || {})
      };
      
      const mappedProps = mapStateToProps ? mapStateToProps(state) : {};
      const dispatchProp = props.dispatch || jest.fn();
      return <Component {...props} {...mappedProps} dispatch={dispatchProp} />;
    };
    ConnectedComponent.displayName = `Connected(${Component.displayName || Component.name})`;
    return ConnectedComponent;
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ slug: 'test-project' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key,
}));

jest.mock('clink-components', () => ({
  Button: ({ children, label, ...props }) => (
    <button {...props}>{label || children}</button>
  ),
  Form: ({ children, render, ...props }) => (
    <form {...props}>
      {render ? render({
        formState: { errors: {} },
        register: jest.fn(() => ({
          onChange: jest.fn(),
          onBlur: jest.fn(),
          ref: jest.fn(),
        })),
        trigger: jest.fn(),
        setValue: jest.fn(),
        control: {},
        getValues: () => ({
          subcontractor: null,
          package: null,
          tba: false,
        }),
      }) : children}
    </form>
  ),
  InputFormControlled: ({ register, name, trigger, errors, control, setValue, ...props }) => {
    const registerProps = register ? register(name) : {};
    return <input data-testid={`input-${name}`} {...registerProps} {...props} />;
  },
  InputForm: ({ register, name, trigger, errors, ...props }) => {
    const registerProps = register ? register(name) : {};
    return <input data-testid={`input-${name}`} {...registerProps} {...props} />;
  },
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: {
      fetchSubcontractors: jest.fn(),
      fetchInstruction: jest.fn(),
      createInstruction: jest.fn(),
      updateInstruction: jest.fn(),
      blockAccess: jest.fn(),
    },
  }),
}));

jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
  getQueryStringVars: () => ({ id: null, type: 'instructions-variations' }),
  setQueryStringVars: jest.fn(),
}));

jest.mock('v2/helpers/currency', () => jest.fn((value) => value));

jest.mock('v2/apps/shared/components/Loading', () => 
  ({ status, message }) => (
    <div data-testid="loading-component">
      <div data-testid="status">{status}</div>
      <div data-testid="message">{message}</div>
    </div>
  )
);

jest.mock('v2/apps/shared/components/WarnModal', () => 
  () => <div data-testid="warn-modal">Warning</div>
);

jest.mock('v2/apps/shared/components/InfoModal', () => 
  ({ title, message, children }) => (
    <div data-testid="info-modal">
      <div data-testid="modal-title">{title}</div>
      <div data-testid="modal-message">{message}</div>
      {children}
    </div>
  )
);

jest.mock('v2/apps/clink/pages/shared/template/helpers', () => ({
  instructionsBreadcrumbs: jest.fn(() => []),
}));

jest.mock('v2/apps/clink/pages/shared/template', () => 
  ({ children, title, slug, breadcrumb, extraPadding }) => (
    <div data-testid="template">
      <div data-testid="template-title">{title}</div>
      <div data-testid="template-slug">{slug}</div>
      {children}
    </div>
  )
);

jest.mock('./PreviewModal', () => 
  ({ id, type, disabledPreview, openPreview, setOpenPreview, refSave }) => (
    <div data-testid="preview-modal">
      <div data-testid="modal-id">{id}</div>
      <div data-testid="modal-type">{type}</div>
    </div>
  )
);

jest.mock('./useFormInstruction', () => 
  () => ({ fullForm: false })
);

jest.mock('v2/apps/shared/components/dropzone', () => 
  (props) => <div data-testid="dropzone" {...props}>Dropzone</div>
);

// Mock the styled components
jest.mock('./styled', () => ({
  StyledAddNewWrapper: ({ children }) => <div data-testid="styled-wrapper">{children}</div>,
  StyledDropdownColumn: ({ children }) => <div data-testid="styled-dropdown">{children}</div>,
  StyledAddDescriptionColumn: ({ children }) => <div data-testid="styled-description">{children}</div>,
  StyledAddAppendixColumn: ({ children }) => <div data-testid="styled-appendix">{children}</div>,
  StyledAddButtons: ({ children }) => <div data-testid="styled-buttons">{children}</div>,
  StyledButtonsWrapper: ({ children }) => <div data-testid="styled-buttons-wrapper">{children}</div>,
  StyledBond: ({ children }) => <div data-testid="styled-bond">{children}</div>,
  StyledValueColumnLeft: ({ children }) => <div data-testid="styled-value-left">{children}</div>,
  StyledValueColumnRight: ({ children }) => <div data-testid="styled-value-right">{children}</div>,
}));

// Simple mock store
const mockStore = {
  getState: () => ({
    project: { data: null },
    instructions: { 
      data: null, 
      subcontractorsList: [], 
      status: null, 
      blocked: false, 
      sentSuccessfully: false 
    }
  }),
  subscribe: () => {},
  dispatch: jest.fn(),
};

describe('FormInstruction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormInstruction />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('template')).toBeInTheDocument();
  });

  it('renders with blocked state', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormInstruction 
            testState={{
              instructions: { 
                data: null, 
                subcontractorsList: [], 
                status: null, 
                blocked: true, 
                sentSuccessfully: false 
              }
            }}
          />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('error');
    expect(screen.getByTestId('message')).toHaveTextContent('already-sent');
  });

  it('renders template with correct title for instructions-variations type', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormInstruction />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('template-title')).toHaveTextContent('instructions-variations');
  });

  it('renders loader when status is loading', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormInstruction 
            testState={{
              instructions: { 
                data: null, 
                subcontractorsList: [], 
                status: 'loading', 
                blocked: false, 
                sentSuccessfully: false 
              }
            }}
          />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders info modal when no subcontractors available', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormInstruction 
            testState={{
              project: { data: { id: 1 } },
              instructions: { 
                data: null, 
                subcontractorsList: [], 
                status: null, 
                blocked: false, 
                sentSuccessfully: false 
              }
            }}
          />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('info-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('no-subcontractors');
    expect(screen.getByTestId('modal-message')).toHaveTextContent('no-orders-yet');
  });

  it('renders success modal when sent successfully', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormInstruction 
            testState={{
              project: { data: { id: 1 } },
              instructions: { 
                data: null, 
                subcontractorsList: [{ id: 1, name: 'Test Subcontractor' }], 
                status: null, 
                blocked: false, 
                sentSuccessfully: true 
              }
            }}
          />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('info-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('success');
  });

  it('renders warn modal when send instruction error', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormInstruction 
            testState={{
              project: { data: { id: 1 } },
              instructions: { 
                data: null, 
                subcontractorsList: [{ id: 1, name: 'Test Subcontractor' }], 
                status: 'send-instruction-error', 
                blocked: false, 
                sentSuccessfully: false 
              }
            }}
          />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('warn-modal')).toBeInTheDocument();
  });
});
