import React from 'react';
import ReactHtmlParser from 'react-html-parser';

const MessageComponent = (props) =>
  typeof message === 'string' ? (
    <p {...props}>{props.children}</p>
  ) : (
    <div {...props}>{props.children}</div>
  );

const ResponseUI = ({
  title,
  message,
  handleCancel,
  cancelLabel = 'Close',
  type = 'alert',
  children = null,
}) => {
  return (
    <div className="react-confirm-alert">
      <div className={`react-confirm-alert-body custom-ui custom-ui--${type}`}>
        <h1>{typeof title === 'string' ? ReactHtmlParser(title) : title}</h1>
        <MessageComponent>
          {typeof message === 'string' ? ReactHtmlParser(message) : message}
        </MessageComponent>
        <div className="custom-ui__buttons">
          <button type="button" className="no" onClick={handleCancel}>
            {cancelLabel}
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

const DefaultYesButton = ({ handleSubmit, acceptLabel }) => (
  <button type="button" className="yes" onClick={handleSubmit}>
    {acceptLabel}
  </button>
);

const AlertUI = ({
  title,
  message,
  handleCancel,
  handleSubmit,
  acceptLabel = 'Yes',
  cancelLabel = 'No',
}) => {
  return (
    <ResponseUI
      title={title}
      message={message}
      handleCancel={handleCancel}
      cancelLabel={cancelLabel}
    >
      {handleSubmit && (
        <DefaultYesButton
          handleSubmit={handleSubmit}
          acceptLabel={acceptLabel}
        />
      )}
    </ResponseUI>
  );
};

export { ResponseUI, AlertUI };
