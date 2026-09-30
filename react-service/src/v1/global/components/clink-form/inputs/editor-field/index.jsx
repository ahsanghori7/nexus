import React from 'react';
import EditorInput from './EditorInput';
import ModalEditor from './Modal';

const EditorField = (props) => {
  const { modal, ...rest } = props;
  return modal ? <ModalEditor {...rest} /> : <EditorInput {...rest} />;
};

export default EditorField;
