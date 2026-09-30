import React from 'react';
import { render, act } from '@testing-library/react';
import Environmental from './Environmental.jsx';
import {
  TYPES,
  NOT_ISO_ACCREDITED,
  BS_EN_ISO_14001_2015,
  OTHER_CERTIFICATE_DOC,
} from 'v2/helpers/prequal/documents';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mockSelect = jest.fn(() => null);
const mockText = jest.fn(() => null);
const mockDate = jest.fn(() => null);
const mockTextEditor = jest.fn(() => null);
const mockFile = jest.fn(() => null);
const mockUseOtherInput = jest.fn();

jest.mock('v2/apps/shared/components/prequalification/v2/form/Select', () => ({
  __esModule: true,
  default: (props) => mockSelect(props),
}));

jest.mock('v2/apps/shared/components/prequalification/v2/form/Text', () => ({
  __esModule: true,
  default: (props) => mockText(props),
}));

jest.mock('v2/apps/shared/components/prequalification/v2/form/Date', () => ({
  __esModule: true,
  default: (props) => mockDate(props),
}));

jest.mock('v2/apps/shared/components/prequalification/v2/form/TextEditor', () => ({
  __esModule: true,
  default: (props) => mockTextEditor(props),
}));

jest.mock('v2/apps/shared/components/prequalification/v2/form/file', () => ({
  __esModule: true,
  default: (props) => mockFile(props),
}));

jest.mock('./useOtherInput', () => ({
  __esModule: true,
  default: (data, type, options, selectedOptions, documentsForm) =>
    mockUseOtherInput(data, type, options, selectedOptions, documentsForm),
}));

describe('Environmental', () => {
  const createForm = (overrides = {}) => ({
    values: { label: '', date: '2023-03-01', document: 'doc.pdf', ...overrides.values },
    errors: overrides.errors || {},
    trigger: jest.fn(),
    register: jest.fn().mockReturnValue({}),
    setValue: jest.fn(),
    control: {},
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders select and file uploader when no other option selected', () => {
    mockUseOtherInput.mockImplementation((data, type) => {
      expect(type).toBe(TYPES.EN);
      return [false, jest.fn(), false, jest.fn()];
    });

    const form = createForm();
    render(
      <Environmental
        data={{ label: 'ISO', requested: true }}
        selectedOptions={['iso']}
        options={[{ label: 'ISO' }]}
        documentsForm={form}
        aid="A1"
      />,
    );

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({ defaultValue: 'ISO' }),
    );
    expect(mockText).not.toHaveBeenCalled();
    expect(mockFile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'document',
        getDocInfo: [undefined, 'A1', undefined],
      }),
    );
  });

  it('shows custom label field when other option active', () => {
    const handleOther = jest.fn();
    const validate = jest.fn();
    mockUseOtherInput.mockReturnValue([true, handleOther, true, validate]);

    const form = createForm();
    render(
      <Environmental
        data={{ custom_label: 'Existing', id: 2, document: 'doc.pdf' }}
        selectedOptions={[]}
        options={[{ label: 'ISO' }]}
        documentsForm={form}
        showOtherOptionForAll
        aid="B2"
      />,
    );

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({ defaultValue: OTHER_CERTIFICATE_DOC }),
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'custom_label',
        required: true,
        validate,
      }),
    );
    const { handleChange } = mockSelect.mock.calls[0][0];
    act(() => {
      handleChange({ target: { value: 'ISO' } });
    });
    expect(handleOther).toHaveBeenCalledWith({ target: { value: 'ISO' } });
  });

  it('toggles date picker and textarea based on selection values', () => {
    const handleOther = jest.fn();
    mockUseOtherInput.mockReturnValue([false, handleOther, false, jest.fn()]);

    const form = createForm();
    render(
      <Environmental
        data={{}}
        selectedOptions={[]}
        options={[{ label: 'ISO 14001' }, { label: 'Not accredited' }]}
        documentsForm={form}
        aid="C3"
      />,
    );

    const { handleChange } = mockSelect.mock.calls[0][0];

    act(() => {
      handleChange({ target: { value: BS_EN_ISO_14001_2015 } });
    });
    expect(mockDate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'date' }),
    );

    mockDate.mockClear();
    act(() => {
      handleChange({ target: { value: NOT_ISO_ACCREDITED } });
    });
    expect(mockTextEditor).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'environmental-not-accredited' }),
    );
  });
});
