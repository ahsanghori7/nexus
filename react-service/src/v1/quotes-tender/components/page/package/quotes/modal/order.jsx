import React, { useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import flag from 'v2/helpers/flags';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import CircularProgress from '@mui/material/CircularProgress';
import IssueOrderService from 'v1/quotes-tender/services/issue-order';
import Relay from 'v1/global/services/Relay';
import { goTo, getDocCreatorUrl } from 'v2/helpers/url';
import { modalRenderer, formRenderer, ButtonRenderer } from './index';

const IssueOrder = (props) => {
  const {
    templates = {},
    subcontractor,
    tid,
    id: qid,
    draftInfo,
    handleClose,
  } = props;
  const { id: sid } = subcontractor;
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [docExists, setDocExists] = useState(false);

  const handleOnChange = () => {
    setDisabled(false);
    setDocExists(false);
  };

  const service = new IssueOrderService({
    templates,
    callback: handleOnChange,
  });

  const alert = docExists && (
    <Alert
      sx={{ width: '100%', ml: 1.3, mr: 1.3 }}
      icon={<CheckIcon fontSize="inherit" />}
      severity="warning"
    >
      You already have a draft Order for this document
    </Alert>
  );

  return modalRenderer(
    'Issue an Order',
    'Choose an Order template you would like to issue',
    (openModalBtnProps) => {
      const { handleClick } = openModalBtnProps;
      const onClick = handleClick;
      const label = 'Issue Order';
      const noTemplates = isEmpty(templates);
      return (
        <MenuItem
          type="button"
          aria-label="Issue Order"
          onClick={onClick}
          name="issue-order"
          disabled={noTemplates}
        >
          {label} {noTemplates && <CircularProgress size={13} />}
        </MenuItem>
      );
    },
    (buttonsProps) => {
      const { setShow } = buttonsProps;
      const buttons = {
        submitButton: (acceptProps) => (
          <>
            {docExists &&
              ButtonRenderer('Continue with draft', {
                ...acceptProps,
                ...{
                  onClick: (e) => {
                    e.preventDefault();
                    goTo(docExists);
                  },
                },
              })}
            {ButtonRenderer(
              <div>{docExists ? 'Start from scratch' : 'Continue'}</div>,
              { ...acceptProps, disabled, loading, enableLoading: true },
            )}
          </>
        ),
        closeButton: (closeProps) =>
          ButtonRenderer(
            'Go back',
            {
              ...closeProps,
              ...{ onClick: handleClose(() => setShow(false)) },
            },
            'error',
          ),
      };

      return formRenderer(
        service,
        buttons,
        (data) => {
          const { issue_order: issueOrder } = data;
          const { id: did, label } = issueOrder;
          setLoading(true);
          const issueOrderRelay = new Relay('order', 'create');

          const [draft_order, draft_documents] = draftInfo;
          if (
            flag('DELETE_DRAFT_ORDER') &&
            !docExists &&
            draft_order &&
            draft_documents?.length
          ) {
            const getDraft = draft_documents.filter((d) => d.name === label);
            if (getDraft.length) {
              const [draft] = getDraft;
              const docUrl = `/document-creator/template/${draft.id}/order/${tid}`;
              setLoading(false);
              setDocExists(docUrl);
              return;
            }
          }
          issueOrderRelay
            .post({}, { qid, sid, did })
            .then((response) => response.json())
            .then((json) => {
              const { id } = json;
              goTo(getDocCreatorUrl(id, 'order', tid));
            })
            .catch(() => {
              setLoading(false);
              // ToDo we should set an error state or show a message here
            });
        },
        null,
        alert,
      );
    },
    `issue-order-modal bigger ${loading ? 'loading' : ''}`,
  );
};

export default IssueOrder;
