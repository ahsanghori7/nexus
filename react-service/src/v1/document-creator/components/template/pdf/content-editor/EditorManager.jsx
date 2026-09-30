import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Editor from 'v1/global/components/clink-form/inputs/editor';
import GreenButton, {
  CloseButton,
} from 'v1/global/components/general-ui/Buttons';

const EditorManager = ({ value, handleConfigChange, setShow }) => {
  const [editorHtml, setEditorHtml] = useState(value);
  const submitChange = () => {
    setShow(false);
    handleConfigChange(editorHtml);
  };
  return (
    <>
      <Editor
        value={value}
        attachment={false}
        bullet={false}
        ordered={false}
        customOnChange={setEditorHtml}
        docCreator
      />
      <div className="container-action-buttons">
        <div className="close-btn">
          <CloseButton
            setShow={setShow}
            closeText="Close"
            variant="outline-danger"
          />
        </div>
        <div className="save-btn">
          <GreenButton
            label="Save changes"
            plusIcon={false}
            onClick={submitChange}
          />
        </div>
      </div>
    </>
  );
};

EditorManager.defaultProps = {
  value: {},
  handleConfigChange: () => {},
  setShow: () => {},
};

EditorManager.propTypes = {
  // Value object for the editor content
  value: PropTypes.object,
  // Function to handle configuration changes
  handleConfigChange: PropTypes.func,
  // Function to control visibility
  setShow: PropTypes.func,
};

export default EditorManager;
