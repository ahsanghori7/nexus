import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NoteTextarea from './NoteTextarea';

// Mock i18next
jest.mock('i18next', () => ({
  t: (key) => key,
}));

describe('NoteTextarea Component', () => {
  const mockDispatch = jest.fn();
  const mockNote = { text: 'Initial note text' };
  const mockStyle = { width: '100%' };

  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('renders without crashing', () => {
    render(
      <NoteTextarea
        note={mockNote}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );
  });

  it('displays initial note text', () => {
    render(
      <NoteTextarea
        note={mockNote}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );

    const textarea = screen.getByDisplayValue('Initial note text');
    expect(textarea).toBeInTheDocument();
  });

  it('displays empty string when note is null', () => {
    render(
      <NoteTextarea
        note={null}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea.value).toBe('');
  });

  it('displays placeholder text', () => {
    render(
      <NoteTextarea
        note={null}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );

    const textarea = screen.getByPlaceholderText('boq-add-notes-placeholder');
    expect(textarea).toBeInTheDocument();
  });

  it('is readonly when editing is false', () => {
    render(
      <NoteTextarea
        note={mockNote}
        editing={false}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('is editable when editing is true', () => {
    render(
      <NoteTextarea
        note={mockNote}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toHaveAttribute('readonly');
  });

  it('updates text on change', () => {
    render(
      <NoteTextarea
        note={mockNote}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New text content' } });

    expect(textarea.value).toBe('New text content');
  });

  it('calls dispatch on blur with updated note', () => {
    render(
      <NoteTextarea
        note={mockNote}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Updated text' } });
    fireEvent.blur(textarea);

    expect(mockDispatch).toHaveBeenCalledWith({
      newNote: { text: 'Updated text' },
      eid: 'test-id',
    });
  });

  it('calls dispatch on blur with original note structure', () => {
    const noteWithExtraProps = { 
      text: 'Initial text', 
      id: 'note-id', 
      timestamp: '2023-01-01' 
    };

    render(
      <NoteTextarea
        note={noteWithExtraProps}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Changed text' } });
    fireEvent.blur(textarea);

    expect(mockDispatch).toHaveBeenCalledWith({
      newNote: {
        text: 'Changed text',
        id: 'note-id',
        timestamp: '2023-01-01',
      },
      eid: 'test-id',
    });
  });

  it('applies custom style', () => {
    render(
      <NoteTextarea
        note={mockNote}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle('width: 100%');
  });

  it('matches snapshot when editing', () => {
    const { container } = render(
      <NoteTextarea
        note={mockNote}
        editing={true}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot when readonly', () => {
    const { container } = render(
      <NoteTextarea
        note={mockNote}
        editing={false}
        dispatch={mockDispatch}
        id="test-id"
        style={mockStyle}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});