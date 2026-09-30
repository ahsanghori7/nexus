import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import GreenButton from '../../../../global/components/general-ui/Buttons';

const Content = ({
  setShow,
  addFolder,
  renameFolder,
  category,
  error,
  loading,
  setError,
  setLoading,
}) => {
  const [text, setText] = useState(category ? category.label : '');

  const add = () => {
    setLoading(true);
    addFolder(text.trim(), setShow, setError, setLoading);
  };

  const rename = () => {
    if (category.label !== text) {
      setLoading(true);
      renameFolder(text.trim(), setShow, setError, setLoading);
    } else {
      setShow(false);
    }
  };

  const handleSetText = (event) => {
    setError(false);
    setText(event.target.value);
  };

  const handleOnClick = () => {
    if (text) {
      if (category) {
        rename();
      } else {
        add();
      }
    }
  };

  return (
    <Form>
      <Form.Group className="mb-3" controlId="category-name">
        <Form.Label>
          Name this folder&nbsp;<span className="required">*</span>
        </Form.Label>
        <Form.Control
          type="text"
          name="category-name"
          value={text}
          onChange={handleSetText}
          onBlur={handleSetText}
          placeholder="Folder name"
        />
        {error && (
          <Form.Text className="error-message">
            There is already a folder with this name
          </Form.Text>
        )}
      </Form.Group>
      <div className="button-container">
        <GreenButton
          size="sm"
          label="Continue"
          onClick={handleOnClick}
          disabled={!text || loading}
          plusIcon={false}
          loading={loading}
        />
        <Button
          disabled={loading}
          onClick={() => setShow(false)}
          variant="outline-danger"
        >
          {' '}
          Go back
        </Button>
      </div>
    </Form>
  );
};

export default Content;
