import React from 'react';
import { render } from '@testing-library/react';
import Accreditations from './Accreditations.jsx';
import { OTHER_CERTIFICATE_DOC, TYPES } from 'v2/helpers/prequal/documents';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mockSelect = jest.fn(() => null);
const mockText = jest.fn(() => null);
const mockDate = jest.fn(() => null);
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

jest.mock('v2/apps/shared/components/prequalification/v2/form/file', () => ({
  __esModule: true,
  default: (props) => mockFile(props),
}));

jest.mock('./useOtherInput', () => ({
  __esModule: true,
  default: (data, type, options, selectedOptions, documentsForm) =>
    mockUseOtherInput(data, type, options, selectedOptions, documentsForm),
}));

describe('Accreditations', () => {
  const createForm = (overrides = {}) => ({
    values: { date: '2023-01-01', document: 'doc.pdf', ...overrides.values },
    errors: overrides.errors || {},
    trigger: jest.fn(),
    register: jest.fn().mockReturnValue({}),
    setValue: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures select options and omits custom text when other flag false', () => {
    mockUseOtherInput.mockImplementation((data, type) => {
      expect(type).toBe(TYPES.CER);
      return [false, jest.fn(), false, jest.fn()];
    });

    const form = createForm();
    const options = [
      { label: 'ISO' },
      { label: 'Other Accreditation' },
    ];

    render(
      <Accreditations
        data={{ id: 10, label: 'ISO', requested: true }}
        selectedOptions={['iso', 'other accreditation']}
        options={options}
        documentsForm={form}
        aid="A1"
      />,
    );

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'label',
        defaultValue: 'ISO',
        handleChange: expect.any(Function),
        options: [
          expect.objectContaining({ label: 'ISO', disabled: true }),
          expect.objectContaining({
            label: 'Other Accreditation',
            disabled: true,
          }),
        ],
      }),
    );
    expect(mockText).not.toHaveBeenCalled();
    expect(mockDate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'date', value: '2023-01-01' }),
    );
    expect(mockFile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'document',
        getDocInfo: [undefined, 'A1', 10],
      }),
    );
  });

  it('renders custom text input when other option chosen and passes file metadata', () => {
    const handleOther = jest.fn();
    const validate = jest.fn();
    mockUseOtherInput.mockReturnValue([true, handleOther, true, validate]);

    const form = createForm({ values: { date: '2023-02-01', document: 'doc.pdf' } });

    render(
      <Accreditations
        data={{
          section: TYPES.CER,
          custom_label: 'Custom',
          document: 'file.pdf',
          original_file: 'origin.pdf',
          id: 4,
        }}
        options={[{ label: 'ISO' }]}
        selectedOptions={[]}
        documentsForm={form}
        aid="B2"
      />,
    );

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({ defaultValue: OTHER_CERTIFICATE_DOC }),
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'custom_label',
        validate,
        required: true,
      }),
    );
    expect(mockFile).toHaveBeenCalledWith(
      expect.objectContaining({
        getDocInfo: ['file.pdf', 'B2', 4],
        originalFile: 'origin.pdf',
      }),
    );
  });
});
