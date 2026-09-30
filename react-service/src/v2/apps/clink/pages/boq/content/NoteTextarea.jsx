import React, { useState } from 'react';
import i18next from 'i18next';
import TextareaAutosize from '@mui/material/TextareaAutosize';

const NoteTextarea = ({ note, editing, dispatch, id, style }) => {
  const [text, setText] = useState(note ? note.text : '');

  const handleChange = (event) => {
    const newText = event.target.value;
    setText(newText);
  };

  const handleOnBlur = () => {
    const newNote = { ...note, text };
    dispatch({ newNote, eid: id });
  };

  return (
    <TextareaAutosize
      readOnly={!editing}
      value={text}
      onChange={handleChange}
      onBlur={handleOnBlur}
      placeholder={i18next.t('boq-add-notes-placeholder')}
      style={style}
      minRows={1}
    />
  );
};

export default NoteTextarea;
