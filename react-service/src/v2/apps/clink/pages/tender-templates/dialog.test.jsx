import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplateModal from './dialog';

// `t` must stay referentially stable across renders — dialog.jsx's `formConfig`
// useMemo depends on `t`, so a new function identity on every call (as real
// react-i18next avoids, but a naive inline mock would not) would make the memo
// recompute every render, re-triggering its effect and looping forever.
const mockT = (key) => key;
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('TemplateModal (Create Tender Document dialog)', () => {
  // String ids: the mocked MUI TextField renders a plain native <input>, whose
  // change events always coerce e.target.value to a string, so options must use
  // string ids for a fired change event to match via strict equality in handleChange.
  const assets = [{ id: '5', name: 'Enquiry Letter' }];
  const tenders = [{ id: '9', name: 'Package A' }];

  const setup = (props = {}) => {
    const setModalOpen = jest.fn();
    const createTemplate = jest.fn().mockResolvedValue('doc-1');
    render(
      <TemplateModal
        pid={1}
        assets={assets}
        tenders={tenders}
        selectedTid={null}
        modalOpen
        setModalOpen={setModalOpen}
        createTemplate={createTemplate}
        {...props}
      />,
    );
    return { setModalOpen, createTemplate };
  };

  it('renders the trigger button and the dialog with its select options', () => {
    setup();

    expect(screen.getByTestId('add-new-tender-btn')).toBeInTheDocument();
    expect(screen.getByTestId('create-tender-document-modal')).toBeInTheDocument();
    expect(screen.getByTestId('asset-option-5')).toHaveTextContent('Enquiry Letter');
    expect(screen.getByTestId('tender-option-9')).toHaveTextContent('Package A');
    expect(screen.getByTestId('go-back-btn')).toBeInTheDocument();
    expect(screen.getByTestId('continue-btn')).toBeInTheDocument();
  });

  it('calls setModalOpen(false) when Go back is clicked', () => {
    const { setModalOpen } = setup();

    fireEvent.click(screen.getByTestId('go-back-btn'));

    expect(setModalOpen).toHaveBeenCalledWith(false);
  });

  it('shows a validation error and does not call createTemplate when submitted without selections', () => {
    const { createTemplate } = setup();

    fireEvent.click(screen.getByTestId('continue-btn'));

    expect(screen.getAllByText('field-required').length).toBeGreaterThan(0);
    expect(createTemplate).not.toHaveBeenCalled();
  });

  it('calls createTemplate with the selected package and asset on submit', async () => {
    const { createTemplate, setModalOpen } = setup();

    fireEvent.change(screen.getByLabelText('select-tender'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText('select-package'), {
      target: { value: '9' },
    });
    fireEvent.click(screen.getByTestId('continue-btn'));

    expect(createTemplate).toHaveBeenCalledWith(1, '9', '5');
    await waitFor(() => expect(setModalOpen).toHaveBeenCalledWith(false));
  });
});
