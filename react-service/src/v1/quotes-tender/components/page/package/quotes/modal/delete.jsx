import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'v2/hooks/context';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DeleteQuoteService from 'v1/quotes-tender/services/delete-quote';
import { modalRenderer, formRenderer, ButtonRenderer } from './index';

const DeleteQuote = (props) => {
  const service = new DeleteQuoteService();
  const { subcontractor, handleClose, submitQuote } = props;
  const { name } = subcontractor;
  const title = () => {
    return (
      <>
        Are you sure you want to remove your <span className="red">{name}</span>{' '}
        quote?
      </>
    );
  };

  return modalRenderer(
    title(),
    `This will remove the quote details from the package`,
    (buttonProps) => {
      const { handleClick } = buttonProps;
      return (
        <MenuItem
          type="button"
          aria-label="Remove Qupte"
          onClick={handleClick}
          name="delete_quote"
        >
          <Typography color="secondary">Remove</Typography>
        </MenuItem>
      );
    },
    (addProps) => {
      const { setShow } = addProps;
      const buttons = {
        submitButton: (addButtonProps) =>
          ButtonRenderer('Yes, remove', addButtonProps, 'error'),
        closeButton: (closeProps) =>
          ButtonRenderer(
            'No, go back',
            {
              ...closeProps,
              ...{ onClick: handleClose(() => setShow(false)) },
            },
            'info',
          ),
      };

      return formRenderer(service, buttons, () => {
        submitQuote().then(() => handleClose(() => setShow(false)));
      });
    },
    'delete-quote-modal',
  );
};

const Wrapper = ({ dispatch, pid, id, tenderId, ...rest }) => {
  const context = useContext('clink');
  const { actions } = context;

  const submitQuote = useCallback(() => {
    return dispatch(actions.deleteQuote({ pid, tid: id, tenderId }));
  }, [dispatch, actions, pid, id, tenderId]);

  return <DeleteQuote {...rest} pid={pid} tid={id} submitQuote={submitQuote} />;
};

export default connect()(Wrapper);
