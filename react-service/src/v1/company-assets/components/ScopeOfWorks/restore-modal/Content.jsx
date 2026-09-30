import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const Content = ({
  template,
  setShow,
  loading,
  restoreTemplate,
  canRestore = true,
}) => {
  const back = canRestore ? 'No, go back' : 'This Template has no changes';
  return (
    <Form>
      <div className="button-container">
        <Button
          disabled={loading}
          onClick={() => setShow(false)}
          variant="outline"
        >
          {back}
        </Button>

        {canRestore && (
          <Button
            disabled={loading}
            onClick={() => {
              restoreTemplate(template.id);
              setShow(false);
            }}
            variant="danger"
          >
            Yes, restore template
          </Button>
        )}
      </div>
    </Form>
  );
};

export default Content;
