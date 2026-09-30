import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SmartBoqBuilderModal from './SmartBoqBuilderModal';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key, values) => {
    if (key === 'boq-smart-builder-error-size') {
      return `${key}:${values?.size}`;
    }
    if (key === 'boq-smart-builder-sheets-count') {
      return `${values?.count} of ${values?.total} selected`;
    }
    return key;
  }),
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkGreen: '#14A38B',
        clinkLightPurple: '#DDE0F5',
        brightGray: '#F3F4F6',
        white: '#FFFFFF',
        black: '#000000',
        clinkRed: '#E53935',
        lightGreen: '#EAF9F5',
      },
    },
  },
}));

jest.mock('xlsx', () => ({
  read: jest.fn(),
}));

// The shared repo-wide Checkbox test mock wires the same handler to both
// onClick and onChange, which double-fires (and net-cancels) a toggle on a
// single fireEvent.click — override it locally so this file's toggle
// assertions reflect a single real interaction, without touching the shared mock.
jest.mock('@mui/material/Checkbox', () => {
  // eslint-disable-next-line global-require
  const ReactLib = require('react');
  return function Checkbox({ checked, onChange, ...props }) {
    return ReactLib.createElement('input', {
      type: 'checkbox',
      checked,
      onChange,
      'data-testid': 'mui-checkbox',
      ...props,
    });
  };
});

// eslint-disable-next-line global-require
const XLSX = require('xlsx');

describe('SmartBoqBuilderModal', () => {
  afterEach(() => {
    XLSX.read.mockReset();
  });

  it('renders the dropzone when open=true', () => {
    render(<SmartBoqBuilderModal open onClose={jest.fn()} onGenerate={jest.fn()} />);

    expect(screen.getByText('boq-smart-builder-title')).toBeInTheDocument();
    expect(screen.getByText('boq-smart-builder-modal-subtitle')).toBeInTheDocument();
    expect(screen.getByText('boq-smart-builder-drop-title')).toBeInTheDocument();
  });

  it('shows the work package title on the dropzone step when packageName is provided', () => {
    render(
      <SmartBoqBuilderModal
        open
        onClose={jest.fn()}
        onGenerate={jest.fn()}
        packageName="Subcontractors testing"
      />,
    );

    expect(screen.getByText('boq-smart-builder-work-package')).toBeInTheDocument();
    expect(screen.getByText('Subcontractors testing')).toBeInTheDocument();
    expect(screen.getByText('boq-smart-builder-drop-title')).toBeInTheDocument();
  });

  it('shows validation error when generate clicked without file', () => {
    render(<SmartBoqBuilderModal open onClose={jest.fn()} onGenerate={jest.fn()} />);

    fireEvent.click(screen.getByText('boq-smart-builder-generate-boq'));
    expect(screen.getByText('boq-smart-builder-error-required')).toBeInTheDocument();
  });

  it('shows type validation error for unsupported extension', () => {
    render(<SmartBoqBuilderModal open onClose={jest.fn()} onGenerate={jest.fn()} />);

    const fileInput = document.querySelector('input[type="file"]');
    const badFile = new File(['abc'], 'spec.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    fireEvent.change(fileInput, { target: { files: [badFile] } });
    expect(screen.getByText('boq-smart-builder-error-type')).toBeInTheDocument();
  });

  it('moves to the confirm screen and calls onGenerate([]) for a non-Excel file', async () => {
    const onGenerate = jest.fn(() => Promise.resolve());
    const onClose = jest.fn();
    render(<SmartBoqBuilderModal open onClose={onClose} onGenerate={onGenerate} />);

    const fileInput = document.querySelector('input[type="file"]');
    const validTxt = new File(['abc'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [validTxt] } });

    expect(screen.queryByText('boq-smart-builder-drop-title')).not.toBeInTheDocument();
    await screen.findByText('notes.txt');
    expect(screen.getByText('boq-smart-builder-change-file')).toBeInTheDocument();

    fireEvent.click(screen.getByText('boq-smart-builder-generate-boq'));

    await waitFor(() => expect(onGenerate).toHaveBeenCalledWith(validTxt, []));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('moves to the confirm screen immediately for a PDF file', async () => {
    const onGenerate = jest.fn(() => Promise.resolve());
    render(<SmartBoqBuilderModal open onClose={jest.fn()} onGenerate={onGenerate} />);

    const fileInput = document.querySelector('input[type="file"]');
    const pdfFile = new File(['abc'], 'boq.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    expect(screen.queryByText('boq-smart-builder-drop-title')).not.toBeInTheDocument();
    expect(screen.getByText('boq.pdf')).toBeInTheDocument();
    expect(screen.queryByText('boq-smart-builder-select-all')).not.toBeInTheDocument();
    expect(screen.getByText('boq-smart-builder-generate-boq')).not.toBeDisabled();

    fireEvent.click(screen.getByText('boq-smart-builder-generate-boq'));
    await waitFor(() => expect(onGenerate).toHaveBeenCalledWith(pdfFile, []));
  });

  it('skips the sheet picker for a single-sheet Excel file', async () => {
    XLSX.read.mockReturnValue({ SheetNames: ['Sheet1'] });
    const onGenerate = jest.fn(() => Promise.resolve());
    render(<SmartBoqBuilderModal open onClose={jest.fn()} onGenerate={onGenerate} />);

    const fileInput = document.querySelector('input[type="file"]');
    const excelFile = new File(['abc'], 'boq.xlsx');
    fireEvent.change(fileInput, { target: { files: [excelFile] } });

    expect(screen.queryByText('boq-smart-builder-drop-title')).not.toBeInTheDocument();
    expect(screen.getByText('boq.xlsx')).toBeInTheDocument();
    expect(screen.queryByText('boq-smart-builder-select-all')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('boq-smart-builder-generate-boq')).not.toBeDisabled()
    );

    fireEvent.click(screen.getByText('boq-smart-builder-generate-boq'));
    await waitFor(() => expect(onGenerate).toHaveBeenCalledWith(excelFile, ['Sheet1']));
  });

  it('shows the sheet picker for a multi-sheet Excel file and gates Generate on a selection', async () => {
    XLSX.read.mockReturnValue({ SheetNames: ['Bill 1', 'Bill 2', 'Summary'] });
    const onGenerate = jest.fn(() => Promise.resolve());
    render(
      <SmartBoqBuilderModal
        open
        onClose={jest.fn()}
        onGenerate={onGenerate}
        packageName="Groundworks Package"
      />
    );

    const fileInput = document.querySelector('input[type="file"]');
    const excelFile = new File(['abc'], 'boq.xlsx');
    fireEvent.change(fileInput, { target: { files: [excelFile] } });

    expect(screen.queryByText('boq-smart-builder-drop-title')).not.toBeInTheDocument();
    expect(screen.getByText('boq.xlsx')).toBeInTheDocument();
    await screen.findByText('Bill 1');
    expect(screen.getByText('Groundworks Package')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 selected')).toBeInTheDocument();
    expect(screen.getByText('boq-smart-builder-generate-boq')).toBeDisabled();

    fireEvent.click(screen.getAllByTestId('mui-checkbox')[0]);
    expect(screen.getByText('1 of 3 selected')).toBeInTheDocument();
    expect(screen.getByText('boq-smart-builder-footer-note')).toBeInTheDocument();
    expect(screen.getByText('boq-smart-builder-generate-boq')).not.toBeDisabled();

    fireEvent.click(screen.getByText('boq-smart-builder-generate-boq'));
    await waitFor(() =>
      expect(onGenerate).toHaveBeenCalledWith(excelFile, ['Bill 1'])
    );
  });

  it('select all / clear all toggles every sheet', async () => {
    XLSX.read.mockReturnValue({ SheetNames: ['Bill 1', 'Bill 2'] });
    render(<SmartBoqBuilderModal open onClose={jest.fn()} onGenerate={jest.fn()} />);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [new File(['abc'], 'boq.xlsx')] } });

    await screen.findByText('Bill 1');
    fireEvent.click(screen.getByText('boq-smart-builder-select-all'));
    expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByText('boq-smart-builder-clear-all'));
    expect(screen.getByText('0 of 2 selected')).toBeInTheDocument();
  });

  it('"Change file" returns to the dropzone and clears the prior selection', async () => {
    XLSX.read.mockReturnValue({ SheetNames: ['Bill 1', 'Bill 2'] });
    render(<SmartBoqBuilderModal open onClose={jest.fn()} onGenerate={jest.fn()} />);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [new File(['abc'], 'boq.xlsx')] } });

    await screen.findByText('Bill 1');
    fireEvent.click(screen.getAllByTestId('mui-checkbox')[0]);

    fireEvent.click(screen.getByText('boq-smart-builder-change-file'));
    expect(screen.getByText('boq-smart-builder-drop-title')).toBeInTheDocument();
    expect(screen.queryByText('Bill 1')).not.toBeInTheDocument();
  });
});
