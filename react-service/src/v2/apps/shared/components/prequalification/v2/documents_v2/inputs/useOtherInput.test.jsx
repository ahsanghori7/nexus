import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useOtherInput from './useOtherInput.js';
import { OTHER_CERTIFICATE_DOC, TYPES } from 'v2/helpers/prequal/documents';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const Harness = ({ data, type, options, selectedOptions, documentsForm }) => {
  const [other, handleOther, otherValue, validateTextField] = useOtherInput(
    data,
    type,
    options,
    selectedOptions,
    documentsForm,
  );
  const [validation, setValidation] = React.useState(null);

  return (
    <div>
      <div data-testid="other">{String(other)}</div>
      <div data-testid="otherValue">{String(otherValue)}</div>
      <button
        type="button"
        data-testid="select-other"
        onClick={() => handleOther({ target: { value: OTHER_CERTIFICATE_DOC } })}
      >
        choose other
      </button>
      <button
        type="button"
        data-testid="select-regular"
        onClick={() => handleOther({ target: { value: 'regular' } })}
      >
        choose regular
      </button>
      <button
        type="button"
        data-testid="validate"
        onClick={() => setValidation(validateTextField('Existing'))}
      >
        validate
      </button>
      {validation !== null && (
        <div data-testid="validation">{String(validation)}</div>
      )}
    </div>
  );
};

describe('useOtherInput', () => {
  const baseForm = (overrides = {}) => ({
    values: {
      label: 'Custom Label',
      ...overrides.values,
    },
    trigger: jest.fn(),
    setValue: jest.fn(),
    ...overrides,
  });

  const renderHarness = (props) => {
    const documentsForm = baseForm(props.documentsForm);
    render(
      <Harness
        data={props.data}
        type={props.type}
        options={props.options}
        selectedOptions={props.selectedOptions || []}
        documentsForm={documentsForm}
      />,
    );
    return documentsForm;
  };

  it('initialises with other option selected and updates form values', async () => {
    const documentsForm = renderHarness({
      data: { section: TYPES.ACC, custom_label: 'Custom Label' },
      type: TYPES.ACC,
      options: [{ label: 'Different' }],
    });

    await waitFor(() => expect(screen.getByTestId('other').textContent).toBe('true'));
    expect(screen.getByTestId('otherValue').textContent).toBe('true');
    expect(documentsForm.setValue).toHaveBeenCalledWith('custom_label', 'Custom Label');
    expect(documentsForm.setValue).toHaveBeenCalledWith('section', TYPES.ACC);
    expect(documentsForm.trigger).toHaveBeenCalledWith('section');
  });

  it('toggles other state and validates duplicates for new entries', async () => {
    const documentsForm = renderHarness({
      data: {},
      type: TYPES.ACC,
      options: [{ label: 'Listed' }],
      selectedOptions: ['existing'],
      documentsForm: { values: { label: 'Listed' } },
    });

    await waitFor(() => expect(screen.getByTestId('other').textContent).toBe('undefined'));

    const user = userEvent.setup();
    await user.click(screen.getByTestId('select-other'));

    await waitFor(() => expect(screen.getByTestId('other').textContent).toBe('true'));
    expect(documentsForm.setValue).toHaveBeenCalledWith('section', TYPES.ACC);

    await user.click(screen.getByTestId('validate'));
    expect(screen.getByTestId('validation').textContent).toBe('existing-accreditation');
  });

  it('accepts existing documents with matching custom label', async () => {
    renderHarness({
      data: { id: 5, custom_label: 'Existing', section: TYPES.ACC },
      type: TYPES.ACC,
      options: [{ label: 'Existing' }],
      selectedOptions: ['existing'],
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('validate'));
    expect(screen.getByTestId('validation').textContent).toBe('true');
  });
});
