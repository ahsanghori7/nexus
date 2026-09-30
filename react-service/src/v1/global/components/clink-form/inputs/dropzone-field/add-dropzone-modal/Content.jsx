import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import GreenButton from '../../../../general-ui/Buttons';
import InputField from '../../InputField';
import Loading from '../../../../Loading';

const Content = ({
  handleSetDropzone,
  setShow,
  fieldName,
  value,
  setFieldValue,
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetText = (event) => {
    const { value: textValue } = event.target;
    setText(textValue);
  };
  const setDropzone = () => {
    if (text) {
      const callback = () => {
        const categoryName = text.toLowerCase().split(' ').join('-');

        setFieldValue(fieldName, {
          ...value,
          [categoryName]: [],
        });
        setLoading(false);
        setShow(false);
      };
      setLoading(true);
      handleSetDropzone(text, callback);
    }
  };
  return (
    <>
      <InputField
        label="Category name"
        name="category-name"
        type="text"
        value={text}
        handleChange={handleSetText}
        handleBlurr={handleSetText}
      />
      {loading && <Loading />}
      <div className="button-container">
        <GreenButton size="sm" onClick={setDropzone} disabled={!text}>
          Add
        </GreenButton>
        <Button onClick={() => setShow(false)} variant="outline-danger">
          {' '}
          Go back
        </Button>
      </div>
    </>
  );
};

export default Content;
