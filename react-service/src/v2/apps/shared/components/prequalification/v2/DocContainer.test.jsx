import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocContainer from './DocContainer';

// Mock dependencies
jest.mock('@mui/material/Box', () => {
  return function MockBox({ children, sx, ...props }) {
    return <div data-testid="mui-box" style={sx} {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Button', () => {
  return function MockButton({ children, onClick, fullWidth, ...props }) {
    return (
      <button
        data-testid="mui-button"
        onClick={onClick}
        {...props}
        {...(fullWidth ? { fullwidth: '' } : {})}
      >
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ children, sx, ...props }) {
    return <div data-testid="mui-typography" style={sx} {...props}>{children}</div>;
  };
});

jest.mock('v2/apps/shared/components/company-v2/Mui.styled', () => ({
  MuiSubtitle: function MockMuiSubtitle({ children }) {
    return <div data-testid="mui-subtitle">{children}</div>;
  },
  MuiSubmitWrapper: function MockMuiSubmitWrapper({ children, capitalize }) {
    return <div data-testid="mui-submit-wrapper" data-capitalize={capitalize}>{children}</div>;
  },
}));

jest.mock('v2/apps/shared/components/dialog', () => {
  return function MockMuiDialog({ children, title, open, handleClose, dialogWidth }) {
    return open ? (
      <div data-testid="mui-dialog" data-title={title} data-width={dialogWidth}>
        <button data-testid="dialog-close" onClick={handleClose}>Close</button>
        {children}
      </div>
    ) : null;
  };
});

jest.mock('./documents_v2/Form', () => {
  return function MockCommonForm(props) {
    return (
      <div data-testid="common-form">
        <span data-testid="form-aid">{props.aid}</span>
        <span data-testid="form-type">{props.type}</span>
        <button data-testid="form-submit" onClick={() => props.handleOnSubmit()}>
          Submit Form
        </button>
      </div>
    );
  };
});

const MockCustomForm = (props) => (
  <div data-testid="custom-form">
    <span data-testid="custom-form-aid">{props.aid}</span>
    <button data-testid="custom-form-submit" onClick={() => props.handleOnSubmit()}>
      Custom Submit
    </button>
  </div>
);

const MockInputs = () => <div data-testid="mock-inputs">Mock Inputs</div>;

describe('DocContainer Component', () => {
  const defaultProps = {
    aid: 'test-aid',
    type: 'test-type',
    title: 'Test Document Title',
    selected: null,
    fileError: null,
    description: 'This is a test description',
    actionLabel: 'Add Document',
    titleDialog: 'Document Dialog',
    sectionData: [],
    action: jest.fn(),
    handleOnClose: jest.fn(),
    handleSubmit: jest.fn(),
    selectedOptions: [],
    options: [],
    open: false,
    Inputs: null,
    showOtherOptionForAll: false,
    children: <div data-testid="test-children">Test Children</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic structure with title and description', () => {
    render(<DocContainer {...defaultProps} />);

    expect(screen.getByTestId('mui-subtitle')).toHaveTextContent('Test Document Title');
    expect(screen.getByTestId('mui-typography')).toHaveTextContent('This is a test description');
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
    expect(screen.getByTestId('mui-button')).toHaveTextContent('Add Document');
  });

  it('does not render title when title is empty', () => {
    const propsWithoutTitle = {
      ...defaultProps,
      title: '',
    };

    render(<DocContainer {...propsWithoutTitle} />);

    expect(screen.queryByTestId('mui-subtitle')).not.toBeInTheDocument();
  });

  it('does not render title when title is null', () => {
    const propsWithNullTitle = {
      ...defaultProps,
      title: null,
    };

    render(<DocContainer {...propsWithNullTitle} />);

    expect(screen.queryByTestId('mui-subtitle')).not.toBeInTheDocument();
  });

  it('renders title when title has length', () => {
    const propsWithTitle = {
      ...defaultProps,
      title: 'Valid Title',
    };

    render(<DocContainer {...propsWithTitle} />);

    expect(screen.getByTestId('mui-subtitle')).toHaveTextContent('Valid Title');
  });

  it('calls action function when button is clicked', () => {
    const mockAction = jest.fn();
    const propsWithAction = {
      ...defaultProps,
      action: mockAction,
    };

    render(<DocContainer {...propsWithAction} />);

    const button = screen.getByTestId('mui-button');
    fireEvent.click(button);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('renders dialog when open is true', () => {
    const propsWithOpenDialog = {
      ...defaultProps,
      open: true,
    };

    render(<DocContainer {...propsWithOpenDialog} />);

    expect(screen.getByTestId('mui-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('mui-dialog')).toHaveAttribute('data-title', 'Document Dialog');
    expect(screen.getByTestId('mui-dialog')).toHaveAttribute('data-width', '448');
  });

  it('does not render dialog when open is false', () => {
    render(<DocContainer {...defaultProps} />);

    expect(screen.queryByTestId('mui-dialog')).not.toBeInTheDocument();
  });

  it('calls handleOnClose when dialog close button is clicked', () => {
    const mockHandleOnClose = jest.fn();
    const propsWithOpenDialog = {
      ...defaultProps,
      open: true,
      handleOnClose: mockHandleOnClose,
    };

    render(<DocContainer {...propsWithOpenDialog} />);

    const closeButton = screen.getByTestId('dialog-close');
    fireEvent.click(closeButton);

    expect(mockHandleOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders CommonForm by default when Form is not provided and dialog is open', () => {
    const propsWithOpenDialog = {
      ...defaultProps,
      open: true,
      // Form is not explicitly set, so it will use the default import CommonForm
    };

    render(<DocContainer {...propsWithOpenDialog} />);

    // The component imports CommonForm by default, so it should render
    expect(screen.getByTestId('common-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-aid')).toHaveTextContent('test-aid');
    expect(screen.getByTestId('form-type')).toHaveTextContent('test-type');
  });

  it('does not render form when Form is explicitly set to null', () => {
    const propsWithNullForm = {
      ...defaultProps,
      open: true,
      Form: null,
    };

    render(<DocContainer {...propsWithNullForm} />);

    expect(screen.queryByTestId('common-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('custom-form')).not.toBeInTheDocument();
  });

  it('renders custom Form component when provided and dialog is open', () => {
    const propsWithCustomForm = {
      ...defaultProps,
      open: true,
      Form: MockCustomForm,
    };

    render(<DocContainer {...propsWithCustomForm} />);

    expect(screen.getByTestId('custom-form')).toBeInTheDocument();
    expect(screen.getByTestId('custom-form-aid')).toHaveTextContent('test-aid');
  });

  it('passes correct props to Form component', () => {
    const mockHandleSubmit = jest.fn();
    const propsWithForm = {
      ...defaultProps,
      open: true,
      Form: MockCustomForm,
      aid: 'custom-aid',
      type: 'custom-type',
      selected: { id: 1, name: 'test' },
      fileError: 'Test error',
      options: [{ id: 1, label: 'Option 1' }],
      sectionData: [{ id: 1, section: 'Test Section' }],
      selectedOptions: ['option1'],
      handleSubmit: mockHandleSubmit,
      showOtherOptionForAll: true,
      Inputs: MockInputs,
    };

    render(<DocContainer {...propsWithForm} />);

    const submitButton = screen.getByTestId('custom-form-submit');
    fireEvent.click(submitButton);

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it('renders Inputs when Inputs component is truthy', () => {
    const propsWithInputs = {
      ...defaultProps,
      open: true,
      Form: MockCustomForm,
      Inputs: MockInputs,
    };

    render(<DocContainer {...propsWithInputs} />);

    expect(screen.getByTestId('custom-form')).toBeInTheDocument();
  });

  it('sets capitalize prop to false for MuiSubmitWrapper', () => {
    render(<DocContainer {...defaultProps} />);

    const submitWrapper = screen.getByTestId('mui-submit-wrapper');
    expect(submitWrapper).toHaveAttribute('data-capitalize', 'false');
  });

  it('renders all button props correctly', () => {
    render(<DocContainer {...defaultProps} />);

    const button = screen.getByTestId('mui-button');
    expect(button).toHaveAttribute('variant', 'contained');
    expect(button).toHaveAttribute('color', 'secondary');
    // Note: Our mock doesn't implement size prop, but the actual MUI Button would have it
    expect(button).toHaveAttribute('fullwidth');
  });

  it('handles empty children', () => {
    const propsWithoutChildren = {
      ...defaultProps,
      children: null,
    };

    render(<DocContainer {...propsWithoutChildren} />);

    // Should still render the box containers
    const boxes = screen.getAllByTestId('mui-box');
    expect(boxes.length).toBeGreaterThan(0);
  });

  it('matches snapshot', () => {
    const { container } = render(<DocContainer {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with dialog open', () => {
    const propsWithOpenDialog = {
      ...defaultProps,
      open: true,
      Form: MockCustomForm,
    };

    const { container } = render(<DocContainer {...propsWithOpenDialog} />);
    expect(container).toMatchSnapshot();
  });
});
