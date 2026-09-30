import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Form from 'v2/apps/prosper/pages/projects/enquiries_v2/enquiry-modal/form';
import { sizeFileIsCorrect } from 'v2/helpers/files';

jest.mock('clink-components', () => {
  const React = require('react');

  let currentFormState = { isDirty: true, isValid: true };
  const setFormState = (nextState = {}) => {
    currentFormState = { ...currentFormState, ...nextState };
  };
  const resetFormState = () => {
    currentFormState = { isDirty: true, isValid: true };
  };

  const formMocks = {
    setValue: jest.fn(),
    trigger: jest.fn(),
    register: jest.fn(() => ({
      name: 'mock-field',
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    })),
  };

  const resetFormMocks = () => {
    formMocks.setValue.mockClear();
    formMocks.trigger.mockClear();
    formMocks.register.mockClear();
  };

  let dropzoneRules;
  const getDropzoneRules = () => dropzoneRules;

  const FormComponent = ({ render, method = 'POST', onSubmit }) => {
    const hook = {
      formState: { errors: {}, ...currentFormState },
      register: formMocks.register,
      control: {},
      setValue: formMocks.setValue,
      trigger: formMocks.trigger,
    };

    const renderedChildren = render ? render(hook) : null;

    const handleSubmit = (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
      if (onSubmit) {
        onSubmit(event);
      }
    };

    return React.createElement(
      'form',
      {
        'data-testid': 'form-content',
        method,
        onSubmit: handleSubmit,
      },
      renderedChildren,
    );
  };

  const InputFormControlled = ({ name, label, autoComplete, placeholder, type = 'text' }) =>
    React.createElement(
      'label',
      { 'data-testid': `input-form-${name}` },
      label ? React.createElement('span', { 'data-testid': `label-${name}` }, label) : null,
      React.createElement('input', {
        'data-testid': `input-controlled-${name}`,
        name,
        autoComplete,
        placeholder,
        type,
      }),
    );

  const InputForm = ({ name, label, type = 'text', autoComplete, placeholder, multiple, rules, children }) => {
    if (type === 'dropzone') {
      dropzoneRules = rules;
      return React.createElement(
        'div',
        { 'data-testid': `input-form-${name}` },
        React.createElement('input', {
          'data-testid': `input-${name}`,
          type: 'file',
          multiple: Boolean(multiple),
          autoComplete,
          placeholder,
          onChange: (event) => {
            const files = Array.from(event.target.files || []);
            const syntheticEvent = {
              currentTarget: {
                files,
              },
            };
            rules?.onChange?.(syntheticEvent);
          },
        }),
        React.createElement(
          'div',
          { 'data-testid': `dropzone-content-${name}` },
          children,
        ),
      );
    }

    return React.createElement(
      'label',
      { 'data-testid': `input-form-${name}` },
      label ? React.createElement('span', { 'data-testid': `label-${name}` }, label) : null,
      React.createElement('input', {
        'data-testid': `input-${name}`,
        name,
        autoComplete,
        placeholder,
        type,
      }),
    );
  };

  const DropzoneWrapper = ({ children }) =>
    React.createElement('div', { 'data-testid': 'dropzone-wrapper' }, children);
  const DropzoneIcon = ({ children }) =>
    React.createElement('div', { 'data-testid': 'dropzone-icon' }, children);
  const DropzoneContent = ({ children }) =>
    React.createElement('div', { 'data-testid': 'dropzone-content' }, children);
  const DropzoneFooter = ({ children }) =>
    React.createElement('div', { 'data-testid': 'dropzone-footer' }, children);

  const DropzoneFileList = ({ files = [], handleDelete, validate }) =>
    React.createElement(
      'div',
      { 'data-testid': 'dropzone-file-list' },
      files.map((file, index) => {
        const validationMessage = validate ? validate(file) : '';
        return React.createElement(
          'div',
          { key: file.name || index, 'data-testid': `dropzone-file-${index}` },
          React.createElement('span', { 'data-testid': `file-name-${index}` }, file.name || `file-${index}`),
          validationMessage
            ? React.createElement('span', { 'data-testid': `file-validation-${index}` }, validationMessage)
            : null,
          React.createElement(
            'button',
            {
              type: 'button',
              'data-testid': `delete-file-${index}`,
              onClick: () => handleDelete?.(file, index),
            },
            'Remove',
          ),
        );
      }),
    );

  const Image = (props) => React.createElement('img', { ...props });
  const Button = React.forwardRef((props, ref) => React.createElement('button', { ...props, ref }, props.children));

  return {
    __esModule: true,
    CONSTANTS: { s3: { upload: 'mock-upload-icon' } },
    Form: FormComponent,
    InputFormControlled,
    InputForm,
    DropzoneWrapper,
    DropzoneIcon,
    DropzoneContent,
    DropzoneFooter,
    DropzoneFileList,
    Image,
    Button,
    getFormMocks: () => formMocks,
    getDropzoneRules,
    setFormState,
    resetFormState,
    resetFormMocks,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'file-too-large') {
        return options?.count > 1 ? 'Files exceed the limit' : 'File exceeds the limit';
      }
      if (key === 'file-size-no-bigger-than') {
        return 'File size no bigger than';
      }
      if (key === 'send-quotation') {
        return 'Send Quotation';
      }
      return key;
    },
  }),
}));

jest.mock('v2/helpers/files', () => ({
  sizeFileIsCorrect: jest.fn(),
}));

const {
  getFormMocks,
  getDropzoneRules,
  resetFormMocks,
  resetFormState,
  setFormState,
} = require('clink-components');

describe('Prosper enquiry form', () => {
  const handleSubmit = jest.fn();
  const updateDocumentsToSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resetFormMocks();
    resetFormState();
    sizeFileIsCorrect.mockReset();
    sizeFileIsCorrect.mockReturnValue(true);
  });

  const renderForm = (props = {}) =>
    render(
      <Form
        handleSubmit={handleSubmit}
        updateDocumentsToSend={updateDocumentsToSend}
        {...props}
      />,
    );

  it('renders core fields and dropzone content', async () => {
    renderForm();

    expect(screen.getByTestId('form-content')).toHaveAttribute('method', 'POST');
    expect(screen.getByTestId('input-form-price')).toBeInTheDocument();
    expect(screen.getByTestId('input-form-work')).toBeInTheDocument();
    expect(screen.getByTestId('input-form-prelims')).toBeInTheDocument();
    expect(screen.getByTestId('input-form-other')).toBeInTheDocument();
    expect(screen.getByTestId('input-form-programme')).toBeInTheDocument();
    expect(screen.getByTestId('input-form-document')).toBeInTheDocument();

    await waitFor(() => {
      expect(updateDocumentsToSend).toHaveBeenCalledWith([]);
    });

    expect(screen.getByTestId('dropzone-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-icon').querySelector('img')).toHaveAttribute('src', 'mock-upload-icon');
    expect(screen.getByTestId('dropzone-footer')).toHaveTextContent('File size no bigger than');

    const submitButton = screen.getByRole('button', { name: 'Send Quotation' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submission once a valid document is added', async () => {
    renderForm();

    const documentInput = screen.getByTestId('input-document');
    const validFile = new File(['pdf-content'], 'quotation.pdf', { type: 'application/pdf' });

    fireEvent.change(documentInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(updateDocumentsToSend).toHaveBeenCalledWith([validFile]);
    });

    expect(getFormMocks().trigger).toHaveBeenCalledWith(['document']);
    expect(screen.getByRole('button', { name: 'Send Quotation' })).not.toBeDisabled();
  });

  it('flags oversize files through validate callback', async () => {
    sizeFileIsCorrect.mockImplementation((file, maxSize) => file.size <= maxSize);
    renderForm();

    const oversizedFile = new File(['oversize'], 'heavy.pdf', { type: 'application/pdf' });
    Object.defineProperty(oversizedFile, 'size', { value: 150 * 1024 * 1024, configurable: true });

    fireEvent.change(screen.getByTestId('input-document'), { target: { files: [oversizedFile] } });

    await waitFor(() => {
      expect(sizeFileIsCorrect).toHaveBeenCalledWith(oversizedFile, 100);
    });

    const validationMessage = screen.getByTestId('file-validation-0');
    expect(validationMessage).toHaveTextContent('File exceeds the limit');
  });

  it('aggregates validation errors when multiple files are oversize', async () => {
    const firstLargeFile = new File(['large-a'], 'big.pdf', { type: 'application/pdf' });
    const secondLargeFile = new File(['large-b'], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(firstLargeFile, 'size', { value: 200 * 1024 * 1024, configurable: true });
    Object.defineProperty(secondLargeFile, 'size', { value: 180 * 1024 * 1024, configurable: true });

    sizeFileIsCorrect.mockImplementation((file, maxSize) => file.size <= maxSize);

    renderForm();

    fireEvent.change(screen.getByTestId('input-document'), {
      target: { files: [firstLargeFile, secondLargeFile] },
    });

    await waitFor(() => {
      expect(updateDocumentsToSend).toHaveBeenCalledWith([firstLargeFile, secondLargeFile]);
    });

    const rules = getDropzoneRules();
    expect(rules.validate.required([])).toBe(false);
    expect(rules.validate.required([firstLargeFile])).toBe(true);

    const sizeValidation = rules.validate.size();
    expect(sizeValidation).toBe('big.pdf, huge.pdf (Files exceed the limit)');
  });

  it('removes documents when delete action is triggered', async () => {
    renderForm();

    const firstFile = new File(['content-1'], 'initial.pdf', { type: 'application/pdf' });
    const secondFile = new File(['content-2'], 'another.pdf', { type: 'application/pdf' });

    fireEvent.change(screen.getByTestId('input-document'), { target: { files: [firstFile, secondFile] } });

    await waitFor(() => {
      expect(updateDocumentsToSend).toHaveBeenCalledWith([firstFile, secondFile]);
    });

    fireEvent.click(screen.getByTestId('delete-file-0'));

    await waitFor(() => {
      expect(getFormMocks().setValue).toHaveBeenCalled();
      expect(updateDocumentsToSend).toHaveBeenCalled();
    });

    const [fieldName, updatedFiles] = getFormMocks().setValue.mock.calls.slice(-1)[0];
    expect(fieldName).toBe('document');
    expect(updatedFiles).toHaveLength(1);
    expect(updatedFiles[0]).toHaveProperty('name', 'another.pdf');

    const lastUpdateArgs = updateDocumentsToSend.mock.calls.slice(-1)[0][0];
    expect(lastUpdateArgs).toHaveLength(1);
    expect(lastUpdateArgs[0]).toHaveProperty('name', 'another.pdf');
  });

  it('keeps submit disabled when form is invalid even with documents', async () => {
    setFormState({ isValid: false });
    renderForm();

    const validFile = new File(['content'], 'ready.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByTestId('input-document'), { target: { files: [validFile] } });

    await waitFor(() => {
      expect(updateDocumentsToSend).toHaveBeenCalledWith([validFile]);
    });

    expect(screen.getByRole('button', { name: 'Send Quotation' })).toBeDisabled();
  });

  it('renders safely when updateDocumentsToSend is omitted', () => {
    expect(() => renderForm({ updateDocumentsToSend: undefined })).not.toThrow();
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
  });
});
