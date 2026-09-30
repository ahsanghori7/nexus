import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import GreenButton from '../../../../global/components/general-ui/Buttons';

const Content = ({ setShow, addTemplate, loading, setError, templates }) => {
  const [text, setText] = useState('');
  const [existingPackage, showExistingPackage] = useState(false);

  const handleSetText = (event) => {
    setError(false);
    setText(event.target.value);
  };

  const handleOnClick = () => {
    if (templates && templates.filter((t) => t.name === text).length) {
      showExistingPackage(true);
    } else {
      addTemplate(text);
      showExistingPackage(false);
      setShow(false);
    }
  };

  const handleOnClose = () => {
    setShow(false);
  };

  return (
    <Form>
      <Form.Group className="mb-3" controlId="category-name">
        <Form.Label>Name this package</Form.Label>
        <Form.Control
          type="text"
          name="category-name"
          value={text}
          onChange={handleSetText}
          onBlur={handleSetText}
          placeholder="Enter name of package"
          className={existingPackage ? 'error-input' : ''}
        />
        {existingPackage && (
          <Form.Text className="error-message">
            A tender with this name already exists
          </Form.Text>
        )}
      </Form.Group>
      <div className="button-container">
        <GreenButton
          size="sm"
          label="Create"
          onClick={handleOnClick}
          disabled={!text || loading}
          plusIcon={false}
          loading={loading}
        />
        <Button
          disabled={loading}
          onClick={handleOnClose}
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
