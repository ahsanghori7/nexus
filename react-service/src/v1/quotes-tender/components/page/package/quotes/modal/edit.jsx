import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'v2/hooks/context';
import MenuItem from '@mui/material/MenuItem';
import i18next from 'v2/helpers/i18n';
import EditQuoteService from 'v1/quotes-tender/services/edit-quote';
import { modalRenderer, formRenderer, ButtonRenderer } from './index';
import { pennyToFloat } from 'v1/quotes-tender/helpers/price';

const EditQuote = (props) => {
  const service = new EditQuoteService();
  const { id, subcontractor, pid, handleClose, submitQuote, tenderId } = props;

  const { name } = subcontractor;
  return modalRenderer(
    'Edit Quote Information',
    `Edit quote information for ${name} here`,
    (buttonProps) => {
      const { handleClick } = buttonProps;
      return (
        <MenuItem
          type="button"
          aria-label="Edit"
          onClick={handleClick}
          name="edit_quote"
        >
          Edit
        </MenuItem>
      );
    },
    (addProps) => {
      const { setShow } = addProps;
      const buttons = {
        submitButton: (addButtonProps) =>
          ButtonRenderer('Save Changes', addButtonProps),
        closeButton: (closeProps) =>
          ButtonRenderer(
            'Close',
            {
              ...closeProps,
              ...{ onClick: handleClose(() => setShow(false)) },
            },
            'error',
          ),
      };

      const { initialValues } = service;
      for (const iv in initialValues) {
        if (Object.prototype.hasOwnProperty.call(initialValues, iv)) {
          initialValues[iv] =
            iv !== 'programme'
              ? `${i18next.t('currency')}${pennyToFloat(props[iv])}`
              : props[iv];
        }
      }

      return formRenderer(service, buttons, (data) => {
        const order = {};
        for (const k in data) {
          if (Object.prototype.hasOwnProperty.call(data, k)) {
            order[k] = String(data[k])
              .replace(/[,£]+/g, '')
              .replace(/[,$]+/g, '')
              .replace(/[,€]+/g, '');
          }
        }

        submitQuote({ order, pid, tid: id, tenderId }).then(() =>
          handleClose(() => setShow(false)),
        );
      });
    },
    'edit-quote-modal',
  );
};

const Wrapper = ({ dispatch, ...rest }) => {
  const context = useContext('clink');
  const { actions } = context;

  const submitQuote = useCallback(
    (data) => {
      return dispatch(actions.editQuote(data));
    },
    [dispatch, actions],
  );

  return <EditQuote {...rest} submitQuote={submitQuote} />;
};

export default connect()(Wrapper);
