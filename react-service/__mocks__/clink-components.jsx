// __mocks__/clink-components.js
const React = require('react');

// Create mock for CONSTANTS
const CONSTANTS = {
  DEFAULT_VALUES: {},
  STATUS: {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    PENDING: 'PENDING',
    CANCELLED: 'CANCELLED'
  },
  ORDER_STATUS: {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    PENDING: 'PENDING',
    CANCELLED: 'CANCELLED'
  },
  PROJECT_STATUS: {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    PENDING: 'PENDING',
    CANCELLED: 'CANCELLED'
  },
  DOCUMENT_TYPE: {
    TENDER: 'TENDER',
    INVOICE: 'INVOICE',
    QUOTE: 'QUOTE'
  },
  dimensions: {
    XL_SCREEN: 1200,
    LG_SCREEN: 1024,
    XLH_SCREEN: 1400,
    L_SCREEN: 1024,
    M_SCREEN: 768,
    MD_SCREEN: 900,
    S_SCREEN: 480,
  },
  colors: {
    general: {
      darkCharcoal: '#333333',
      eerieBlack: '#1A1A1A',
      white: '#FFFFFF',
      aliceBlue: '#F0F8FF',
      black: '#000000',
      red: '#FF0000',
      green: '#00FF00',
      blue: '#0000FF',
      clinkGreen: '#00FF00',
      clinkRed: '#FF0000',
      boqAccent: '#14A38B',
      boqAccentHover: '#128A75',
      boqSectionBg: '#F9FAFB',
      clinkLightPurple: '#E6E6FA',
      clinkPurple: '#800080',
      clinkLightGray: '#F5F5F5',
      clinkBackgroundPurple: '#FAFAFA',
      lightPeriwinkle: '#e6e6fa',
      ghostWhite2: '#f8f8f8',
      platinum2: '#e5e5e5',
      ruby: '#cc0000',
    },
    // Prosper colors
    prosper: {
      prosperBoxGreen: '#4CAF50',
      prosperGreenBg: '#E8F5E9',
      prosperOrange: '#FF9800',
      prosperOrange2: '#FF5722',
      prosperBoxRed: '#F44336',
      prosperCursorGray: '#9E9E9E',
      prosperCursorGrayDark: '#757575',
      prosperProBg: '#6B46C1',
      prosperRedBorder: '#DC2626',
      prosperBlack: '#1F2937',
      prosperProBgGrayIcon: '#9CA3AF',
      prosperGrayDisabled: '#F5F5F5'
    },
  },
  fonts: {
    sofia: 'Sofia Pro',
    proxima_nova1: 'Proxima Nova Regular',
    proxima_nova2: 'Proxima Nova Bold',
    proxima: 'Proxima Nova',
    roboto: 'Roboto',
    openSans: 'Open Sans'
  },
  s3: {
    iconBlackAccept: 'mock-black-accept-icon',
    iconBlackInterest: 'mock-black-interest-icon',
    iconBlackQuote: 'mock-black-quote-icon',
    iconQuoteBlack: 'mock-quote-black-icon',
    iconBlackTender: 'mock-black-tender-icon',
    iconBlackTrophy: 'mock-black-trophy-icon',
    iconWhiteAccept: 'mock-white-accept-icon',
    iconWhiteInterest: 'mock-white-interest-icon',
    iconWhiteQuote: 'mock-white-quote-icon',
    iconWhiteTender: 'mock-white-tender-icon',
    iconWhiteTrophy: 'mock-white-trophy-icon',
    iconClinkLogo: 'https://example.com/logo.svg',
    prosperLogoFull: 'https://example.com/prosper-logo-full.svg',
    blackCarretDown: 'mock-black-carret-down-icon',
    blackCarretUp: 'mock-black-carret-up-icon',
    iconSearchGreen: 'mock-search-green-icon',
    rocketLogo: 'mock-rocket-logo-icon',
    poundWhite: 'mock-pound-white-icon',
    iconWhiteBell: 'mock-white-bell-icon',
    iconWhiteClock: 'mock-white-clock-icon',
    iconThumbnailBuildingsDesktop: 'mock-buildings-desktop-icon',
    iconThumbnailBuildingsMobile: 'mock-buildings-mobile-icon',
    iconThumbnailWorkers: 'mock-workers-icon',
    iconPartyHorn: 'mock-party-horn-icon',
    iconCloseRed: 'mock-close-red-icon',
    redCaretLeft: 'mock-red-caret-left-icon',
    redCaretRight: 'mock-red-caret-right-icon',
    upload: 'mock-upload-icon',
    uploadSvg: 'mock-upload-svg',
    locationLogo: 'mock-location-logo',
    infoLogo: 'mock-info-logo',
    calendarLogo: 'mock-calendar-logo',
    statusLogo: 'mock-status-logo',
    prosperPackagesDefault: 'mock-prosper-packages-default',
  },
};

// Create mock for HELPERS
const HELPERS = {
  colorGenerator: jest.fn().mockImplementation(() => '#000000'),
  dateFormatter: jest.fn().mockImplementation((date) => date ? date.toString() : ''),
  currency: jest.fn().mockImplementation((value) => `£${value}`),
  percentage: jest.fn().mockImplementation((value) => `${value}%`),
  PasswordValidation: {
    testPassword: jest.fn().mockImplementation((password) => {
      if (!password || password.length < 8) {
        return ['too-short'];
      }
      return [null];
    }),
  },
};

// Define icon mocks
const iconBlackAccept = 'icon-black-accept';
const iconBlackInterest = 'icon-black-interest';
const iconBlackQuote = 'icon-black-quote';
const iconBlackTender = 'icon-black-tender';
const iconBlackAccepted = 'icon-black-accepted';
const iconPurchaseOrderDark = 'icon-purchase-order-dark';
const iconPurchaseOrderLight = 'icon-purchase-order-light';
const iconBlackInvoice = 'icon-black-invoice';
const iconQuotationsDetail = 'icon-quotations-detail';
const iconPOinvoices = 'icon-po-invoices';

// Define mock components
const Status = React.forwardRef((props, ref) => {
  const { severity = 'info', message = '' } = props;
  return React.createElement('div', {
    ...props,
    ref,
    'data-testid': 'status',
    className: `status-component severity-${severity}`
  }, message);
});

const Button = React.forwardRef((props, ref) => {
  const { handleClick, ...otherProps } = props;
  return React.createElement('button', {
    ...otherProps,
    onClick: handleClick,
    ref
  });
});

const TextField = React.forwardRef((props, ref) => {
  return React.createElement('input', { type: 'text', ...props, ref });
});

const Select = React.forwardRef((props, ref) => {
  return React.createElement('select', { ...props, ref });
});

// Mock InputForm component
const InputForm = ({ label, errors, name, type, autoComplete, placeholder, defaultValue, readOnly, register, rules, callback, trigger, children, documents, multiple, setValue, theme, validate, ...props }) => {
  // Special handling for dropzone type
  if (type === 'dropzone') {
    return React.createElement('div', { 'data-testid': `input-form-${name}` }, [
      label && React.createElement('label', { htmlFor: name, key: 'label' }, label),
      React.createElement('div', {
        'data-testid': `input-${name}`,
        key: 'dropzone-container'
      }, children),
      errors && errors[name] && React.createElement('span', {
        'data-testid': `error-${name}`,
        key: 'error'
      }, errors[name].message)
    ]);
  }

  // Filter out React Hook Form specific props that shouldn't be passed to DOM
  const domProps = Object.keys(props).reduce((acc, key) => {
    if (!['register', 'rules', 'errors', 'callback', 'trigger', 'documents', 'multiple', 'setValue', 'theme', 'validate'].includes(key)) {
      acc[key] = props[key];
    }
    return acc;
  }, {});

  const inputProps = {
    'data-testid': `input-${name}`,
    id: name,
    name: name,
    type: type,
    autoComplete: autoComplete,
    placeholder: placeholder,
    key: 'input',
    ...domProps
  };

  // Add appropriate value/defaultValue props
  if (type === 'checkbox') {
    if (props.checked !== undefined) {
      inputProps.checked = props.checked;
    } else {
      inputProps.checked = false;
    }
    if (props.defaultChecked !== undefined) {
      inputProps.defaultChecked = props.defaultChecked;
    }
    // Don't add value prop for checkboxes
  } else {
    if (defaultValue !== undefined) {
      inputProps.defaultValue = defaultValue;
    }
    if (props.value !== undefined) {
      inputProps.value = props.value;
    } else if (inputProps.defaultValue === undefined) {
      inputProps.value = ''; // Ensure controlled component
    }
  }

  // Only add readOnly if it's true, otherwise add onChange
  if (readOnly) {
    inputProps.readOnly = true;
  } else {
    inputProps.onChange = jest.fn();
  }

  return React.createElement('div', { 'data-testid': `input-form-${name}` }, [
    label && React.createElement('label', { htmlFor: name, key: 'label' }, label),
    React.createElement('input', inputProps),
    errors && errors[name] && React.createElement('span', {
      'data-testid': `error-${name}`,
      key: 'error'
    }, errors[name].message)
  ]);
};

// Mock InputFormControlled component
const InputFormControlled = ({ label, errors, name, type, autoComplete, placeholder, value, readOnly, register, rules, control, setValue, manualMode, manualLabel, asyncLabel, callback, trigger, options, checked, theme, ...props }) => {
  // Filter out React Hook Form specific props and other non-DOM props that shouldn't be passed to DOM
  const domProps = Object.keys(props).reduce((acc, key) => {
    const filterProps = [
      'register', 'rules', 'errors', 'control', 'setValue',
      'manualMode', 'manualLabel', 'asyncLabel', 'callback',
      'trigger', 'options', 'checked', 'theme', 'validate',
      'watch', 'reset', 'getValues', 'formState', 'handleSubmit'
    ];
    if (!filterProps.includes(key)) {
      acc[key] = props[key];
    }
    return acc;
  }, {});

  // Special handling for editor type
  if (type === 'editor') {
    return React.createElement('div', { 'data-testid': 'input-form-controlled' }, [
      label && React.createElement('label', { htmlFor: name, key: 'label' }, label),
      React.createElement('input', {
        'data-testid': `input-${name}`,
        id: name,
        name: name,
        type: 'text', // Make it appear as text input for tests
        key: 'editor',
        onChange: jest.fn(),
        // Only spread safe DOM props - no register, trigger, etc.
        ...(domProps.autoComplete && { autoComplete: domProps.autoComplete }),
        ...(domProps.placeholder && { placeholder: domProps.placeholder }),
        ...(domProps.value !== undefined && { value: domProps.value }),
        ...(domProps.disabled !== undefined && { disabled: domProps.disabled }),
        ...(domProps.required !== undefined && { required: domProps.required }),
        ...(domProps.maxLength && { maxLength: domProps.maxLength }),
        ...(domProps.minLength && { minLength: domProps.minLength })
      }),
      errors && errors[name] && React.createElement('span', {
        'data-testid': `error-${name}`,
        key: 'error'
      }, errors[name].message)
    ]);
  }

  if (type === 'select' && options) {
    return React.createElement('div', { 'data-testid': `input-form-${name}` }, [
      label && React.createElement('label', { htmlFor: name, key: 'label' }, label),
      React.createElement('select', {
        'data-testid': `select-${name}`,
        id: name,
        name: name,
        onChange: jest.fn(),
        key: 'select',
        ...domProps
      }, [
        React.createElement('option', { key: 'placeholder', value: '' }, placeholder || 'Select from list'),
        ...options.map((option, index) =>
          React.createElement('option', {
            key: option.id || index,
            value: option.id || option.value || option
          }, option.label || option.name || option)
        )
      ]),
      errors && errors[name] && React.createElement('span', {
        'data-testid': `error-${name}`,
        key: 'error'
      }, errors[name].message)
    ]);
  }

  // Handle checkbox type
  if (type === 'checkbox' && options) {
    return React.createElement('div', { 'data-testid': `input-form-${name}` },
      options.map((option, index) =>
        React.createElement('label', {
          key: option.value || index,
          'data-testid': `checkbox-label-${name}-${option.value || index}`
        }, [
          React.createElement('input', {
            key: 'checkbox',
            'data-testid': `checkbox-${name}-${option.value || index}`,
            type: 'checkbox',
            name: name,
            value: option.value,
            checked: checked,
            onChange: jest.fn(),
            ...domProps
          }),
          React.createElement('span', { key: 'label' }, option.label)
        ])
      )
    );
  }

  const inputProps = {
    'data-testid': `input-controlled-${name}`,
    id: name,
    name: name,
    type: type,
    autoComplete: autoComplete,
    placeholder: placeholder,
    onChange: jest.fn(),
    key: 'input',
    ...domProps
  };

  // Handle different input types
  if (type === 'checkbox') {
    inputProps.checked = checked !== undefined ? checked : false;
    delete inputProps.value; // Remove value prop for checkboxes
  } else {
    inputProps.value = value !== undefined ? value : '';
  }

  // Only add readOnly if it's true
  if (readOnly) {
    inputProps.readOnly = true;
    delete inputProps.onChange;
  }

  return React.createElement('div', { 'data-testid': `input-form-${name}` }, [
    label && React.createElement('label', { htmlFor: name, key: 'label' }, label),
    React.createElement('input', inputProps),
    errors && errors[name] && React.createElement('span', {
      'data-testid': `error-${name}`,
      key: 'error'
    }, errors[name].message)
  ]);
};

// Mock InputEmail component
const InputEmail = ({ label, name, type, defaultValue, onChange, hasError, autoComplete, ...props }) => {
  return React.createElement('div', { 'data-testid': `input-email-${name}` }, [
    label && React.createElement('label', { htmlFor: name, key: 'label' }, label),
    React.createElement('input', {
      'data-testid': `input-email-field-${name}`,
      id: name,
      name: name,
      type: type || 'email',
      defaultValue: defaultValue,
      onChange: onChange,
      autoComplete: autoComplete,
      className: hasError ? 'error' : '',
      key: 'input',
      ...props
    })
  ]);
};

// Mock InputText component
const InputText = ({ label, name, type, inputValue, onChange, hasError, autoComplete, ...props }) => {
  return React.createElement('div', { 'data-testid': `input-text-${name}` }, [
    label && React.createElement('label', { htmlFor: name, key: 'label' }, label),
    React.createElement('input', {
      'data-testid': `input-text-field-${name}`,
      id: name,
      name: name,
      type: type || 'text',
      value: inputValue,
      onChange: onChange,
      autoComplete: autoComplete,
      className: hasError ? 'error' : '',
      key: 'input',
      ...props
    })
  ]);
};

// Mock Form component
const Form = ({ children, onSubmit, render, defaultValues, disableUntilValid, method, ...props }) => {
  const mockFormHook = {
    formState: {
      errors: {},
      isDirty: false,  // Changed to false to make submit disabled initially
      isValid: false,  // Changed to false to make submit disabled initially
    },
    register: jest.fn(() => ({ name: 'test', onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() })),
    setValue: jest.fn(),
    trigger: jest.fn(),
    control: {},
    getValues: jest.fn(() => defaultValues || {}),
    handleSubmit: jest.fn((fn) => (e) => {
      if (e && e.preventDefault) e.preventDefault();
      fn(defaultValues || {});
    }),
  };

  const handleFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSubmit) {
      onSubmit(defaultValues || {});
    }
  };

  if (render && typeof render === 'function') {
    try {
      const renderResult = render(mockFormHook);
      // Handle React Fragment and other React elements
      let validResult;

      if (React.isValidElement(renderResult)) {
        validResult = renderResult;
      } else if (renderResult && renderResult.type === React.Fragment) {
        validResult = renderResult;
      } else if (Array.isArray(renderResult)) {
        // Handle array of elements
        validResult = React.createElement(React.Fragment, {}, ...renderResult);
      } else {
        // Fallback for any other case
        validResult = renderResult || React.createElement('div', { 'data-testid': 'form-content' }, 'Form content');
      }

      return React.createElement('form', {
        'data-testid': 'clink-form',
        onSubmit: handleFormSubmit,
        method: method,
        ...props
      }, validResult);
    } catch (error) {
      console.error('Error in render function:', error);
      return React.createElement('form', {
        'data-testid': 'clink-form',
        onSubmit: handleFormSubmit,
        method: method,
        ...props
      }, React.createElement('div', { 'data-testid': 'form-content' }, 'Form content'));
    }
  }

  return React.createElement('form', {
    'data-testid': 'clink-form',
    onSubmit: handleFormSubmit,
    method: method,
    ...props
  }, children || React.createElement('div', { 'data-testid': 'form-content' }, 'Form content'));
};

// Mock Modal component
const Modal = ({ children, className, openElement, render, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const modalProps = {
    isOpen,
    handleOpen: () => setIsOpen(true),
    handleClose: () => setIsOpen(false),
  };

  return React.createElement('div', { 'data-testid': 'modal-container' }, [
    openElement && React.createElement('div', {
      key: 'open-element',
      onClick: modalProps.handleOpen,
      'data-testid': 'modal-trigger'
    }, openElement),
    isOpen && React.createElement('div', {
      key: 'modal-content',
      'data-testid': 'modal',
      className: className,
      ...props
    }, render ? render(modalProps) : children)
  ]);
};

// Mock ModalContent component
const ModalContent = ({ children, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'modal-content',
    ...props
  }, children);
};

// Mock Gantt component
const Gantt = React.forwardRef(({ tasks = [], view, onClick, ...props }, ref) => {
  const safeTasks = tasks || [];
  return React.createElement('div', {
    'data-testid': 'gantt-component',
    ref,
    ...props
  }, [
    React.createElement('div', { key: 'gantt-header' }, `Gantt Chart - View: ${view}`),
    safeTasks.map((task, index) =>
      React.createElement('div', {
        key: task?.id || index,
        'data-testid': `gantt-task-${task?.id || index}`,
        onClick: () => onClick && onClick(task),
        style: { cursor: onClick ? 'pointer' : 'default' }
      }, task?.label || `Task ${index + 1}`)
    )
  ]);
});

// Tabs component mock
const Tabs = React.forwardRef((props, ref) => {
  const { options = [] } = props;

  return React.createElement('div', {
    ref,
    'data-testid': 'preq-tab-wrapper',
    className: 'tabs-component'
  }, options.map((option, index) =>
    React.createElement('div', {
      key: option.id || index,
      'data-testid': `tab-option-${option.id || index}`,
      className: 'tab-option'
    }, option.content)
  ));
});

// Export all mocks
module.exports = {
  CONSTANTS,
  HELPERS,
  HOOKS: {
    useWindowDimensions: () => ({ width: 1200, height: 800 }),
  },
  Status,
  Button,
  TextField,
  Select,
  InputForm,
  InputFormControlled,
  InputEmail,
  InputText,
  Form: Form,
  ClinkForm: Form,
  Modal,
  ModalContent,
  Gantt,
  Tabs,
  iconBlackAccept,
  iconBlackInterest,
  iconBlackQuote,
  iconBlackTender,
  iconBlackAccepted,
  iconPurchaseOrderDark,
  iconPurchaseOrderLight,
  iconBlackInvoice,
  iconQuotationsDetail,
  iconPOinvoices,
  ButtonImage: React.forwardRef((props, ref) => {
    return React.createElement('button-image', { ...props, ref });
  }),
  Image: React.forwardRef((props, ref) => {
    return React.createElement('img', { ...props, ref });
  }),
  Page: React.forwardRef((props, ref) => {
    return React.createElement('div', { ...props, ref, 'data-testid': 'page' });
  }),
  Dropdown: React.forwardRef((props, ref) => {
    const { renderOpenDropdown, openButton, content, className, xOffset, align, ...otherProps } = props;
    const [isOpen, setIsOpen] = React.useState(false); // Default to closed for testing

    const handleClick = () => setIsOpen(!isOpen);

    return React.createElement('div', {
      ...otherProps,
      ref,
      className: `dropdown ${className || ''}`,
      'data-testid': 'dropdown',
      openButton: openButton // Keep this for debugging
    }, [
      // Render either the custom renderOpenDropdown or a simple button with openButton text
      (renderOpenDropdown || openButton) && React.createElement('div', {
        key: 'dropdown-trigger'
      }, renderOpenDropdown ? renderOpenDropdown({
        isOpen,
        align: align || 'left',
        handleClick
      }) : React.createElement('button', {
        'data-testid': 'open-dropdown',
        onClick: handleClick,
        className: 'open-dropdown'
      }, openButton)),
      isOpen && React.createElement('div', {
        key: 'dropdown-content',
        'data-testid': 'dropdown-content',
        className: 'dropdown-content'
      }, content)
    ].filter(Boolean));
  }),
  OpenDropdown: React.forwardRef((props, ref) => {
    const { open, align, handleClick, downIcon, upIcon, ...otherProps } = props;
    return React.createElement('button', {
      ...otherProps,
      ref,
      onClick: handleClick,
      'data-testid': 'open-dropdown',
      className: 'open-dropdown'
    }, open ? upIcon : downIcon);
  }),
  Justify: React.forwardRef((props, ref) => {
    return React.createElement('div', {
      ...props,
      ref,
      'data-testid': 'justify',
      className: `justify ${props.className || ''}`
    });
  }),
  Table: React.forwardRef((props, ref) => {
    const {
      columns = [],
      rows = [],
      pagination,
      rowsPerPageOptions,
      onChangeOrder,
      onPageChange,
      initRowsPerPage,
      rowsCount,
      ...otherProps
    } = props;

    return React.createElement('div', {
      ref,
      'data-testid': 'table',
      className: 'table-component',
      initRowsPerPage,
      rowsCount
    }, [
      React.createElement('div', {
        key: 'table-content',
        'data-testid': 'table-content'
      }, `Table with ${rows.length} rows and ${columns.length} columns`),
      pagination && React.createElement('div', {
        key: 'table-pagination',
        'data-testid': 'table-pagination'
      }, `Pagination: ${rowsPerPageOptions?.join(', ') || 'default options'}`),
      // Render row content including links and actions
      ...rows.map((row, index) =>
        React.createElement('div', {
          key: `row-${index}`,
          'data-testid': `table-row-${index}`
        }, [
          row.company && React.createElement('div', {
            key: 'company-cell',
            'data-testid': `company-cell-${index}`
          }, row.company),
          row.actions && React.createElement('div', {
            key: 'actions-cell',
            'data-testid': `actions-cell-${index}`
          }, row.actions)
        ])
      )
    ].filter(Boolean));
  }),
  Carousel: React.forwardRef((props, ref) => {
    const { children, renderArrowPrev, renderArrowNext, ...otherProps } = props;
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const prevItem = () => setCurrentIndex(prev => prev > 0 ? prev - 1 : prev);
    const nextItem = () => setCurrentIndex(prev => prev + 1);

    return React.createElement('div', {
      'data-testid': 'carousel',
      ref,
      ...otherProps
    }, [
      renderArrowPrev && React.createElement('div', {
        key: 'prev-arrow',
        'data-testid': 'carousel-prev-arrow'
      }, renderArrowPrev(prevItem, 'Previous')),
      React.createElement('div', {
        key: 'carousel-content',
        'data-testid': 'carousel-content'
      }, children),
      renderArrowNext && React.createElement('div', {
        key: 'next-arrow',
        'data-testid': 'carousel-next-arrow'
      }, renderArrowNext(nextItem, 'Next'))
    ].filter(Boolean));
  }),
  // Mock PasswordValidationBox
  PasswordValidationBox: React.forwardRef((props, ref) => {
    const { showValidationBox, errors = [] } = props;

    if (!showValidationBox || !errors.length) {
      return null;
    }

    return React.createElement('div', {
      'data-testid': 'password-validation-box',
      ref,
      className: 'password-validation-box'
    }, errors.map((error, index) =>
      React.createElement('div', {
        key: index,
        'data-testid': `password-error-${index}`,
        className: 'password-error'
      }, error)
    ));
  }),
  // Dropzone components
  DropzoneWrapper: React.forwardRef((props, ref) => {
    return React.createElement('div', {
      ...props,
      ref,
      'data-testid': 'dropzone-wrapper',
      className: 'dropzone-wrapper'
    });
  }),
  DropzoneIcon: React.forwardRef((props, ref) => {
    return React.createElement('div', {
      ...props,
      ref,
      'data-testid': 'dropzone-icon',
      className: 'dropzone-icon'
    });
  }),
  DropzoneContent: React.forwardRef((props, ref) => {
    return React.createElement('div', {
      ...props,
      ref,
      'data-testid': 'dropzone-content',
      className: 'dropzone-content'
    });
  }),
  DropzoneFooter: React.forwardRef((props, ref) => {
    return React.createElement('div', {
      ...props,
      ref,
      'data-testid': 'dropzone-footer',
      className: 'dropzone-footer'
    });
  }),
  DropzoneFileList: React.forwardRef((props, ref) => {
    const { files = [], handleDelete, validate, theme, ...domProps } = props;
    return React.createElement('div', {
      ...domProps,
      ref,
      'data-testid': 'dropzone-file-list',
      className: 'dropzone-file-list'
    }, files.map((file, index) =>
      React.createElement('div', {
        key: index,
        'data-testid': `dropzone-file-${index}`,
        className: 'dropzone-file-item'
      }, [
        React.createElement('span', { key: 'name' }, file.name || `file-${index}`),
        React.createElement('button', {
          key: 'delete',
          'data-testid': `delete-file-${index}`,
          onClick: () => handleDelete && handleDelete(file, index)
        }, 'Delete')
      ])
    ));
  }),
  DropzoneAccordionFileList: React.forwardRef((props, ref) => {
    const { files = [], handleDelete, validate, theme, ...domProps } = props;
    return React.createElement('div', {
      ...domProps,
      ref,
      'data-testid': 'dropzone-accordion-file-list',
      className: 'dropzone-accordion-file-list'
    }, files.map((file, index) =>
      React.createElement('div', {
        key: index,
        'data-testid': `dropzone-accordion-file-${index}`,
        className: 'dropzone-accordion-file-item'
      }, [
        React.createElement('span', { key: 'name' }, file.name || `file-${index}`),
        React.createElement('button', {
          key: 'delete',
          'data-testid': `delete-accordion-file-${index}`,
          onClick: () => handleDelete && handleDelete(file, index)
        }, 'Delete')
      ])
    ));
  }),
  // Add a proxy for any other component access
  __esModule: true,
  default: new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return React.forwardRef((props, ref) => {
          return React.createElement(prop, { ...props, ref });
        });
      }
      return undefined;
    }
  })
};
