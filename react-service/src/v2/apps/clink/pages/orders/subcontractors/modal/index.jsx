import React, { useState } from 'react';
import { CONSTANTS } from 'clink-components';
import i18next from 'i18next';
import Typography from '@mui/material/Typography';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Box from '@mui/material/Box';
import ConfirmModal, {
  Content as ContentModal,
} from 'v2/apps/shared/components/confirm-modal/v2';
import {
  style as defaultStyles,
  cancelStyle,
  acceptStyle,
  textStyles,
} from './styles';

const { clinkRed } = CONSTANTS.colors.general;

const Modal = ({
  open,
  setOpen,
  children,
  style = {},
  acceptStyleProp = {},
  cancelStyleProp = {},
  titleStyleProp = {},
  navTitleColor,
  onBackdropClick,
}) => {
  const [val, setVal] = useState('');
  let handleAccept = open && open.handleAccept ? open.handleAccept : null;
  const id = open && open.id ? open.id : null;

  const navTitle = open && open.navTitle ? open.navTitle : null;
  const navTitleInterpolation =
    open && open.navTitleInterpolation ? open.navTitleInterpolation : null;
  const title = open && open.title ? open.title : null;
  const cancel = open && open.cancel ? open.cancel : null;
  const confirm = open && open.confirm ? open.confirm : null;
  const description = open && open.description ? open.description : null;
  const childrenCheck = open && children ? children : null;
  let disabled = open && open.disabled ? open.disabled : false;
  const backdropClick = open && open.backdropClick ? open.backdropClick : false;
  const textArea = open && open.textArea ? open.textArea : false;
  const callbackClose =
    open && open.callbackClose ? open.callbackClose : () => null;
  if (textArea) {
    disabled = !Boolean(val);
    handleAccept =
      open && open.handleAccept ? () => open.handleAccept(val) : null;
  }

  const handleClose = (event, reason) => {
    if (backdropClick && reason && reason === 'backdropClick') return;
    setOpen(false);
    callbackClose();
  };
  return (
    <ConfirmModal
      id={id}
      openModal={Boolean(open)}
      handleClose={handleClose}
      onBackdropClick={onBackdropClick}
    >
      <ContentModal
        style={{ ...defaultStyles, ...style }}
        cancelStyle={{ ...cancelStyle, ...cancelStyleProp }}
        acceptStyle={{ ...acceptStyle, ...acceptStyleProp }}
        titleStyle={{ ...textStyles, ...titleStyleProp }}
        descriptionStyle={{ ...textStyles, mt: 0 }}
        navTitle={navTitle}
        navTitleColor={navTitleColor}
        navTitleInterpolation={navTitleInterpolation}
        title={title}
        cancel={cancel}
        confirm={confirm}
        description={description}
        handleCancel={handleClose}
        handleAccept={handleAccept}
        disabled={disabled}
      >
        {childrenCheck}
        {textArea && (
          <Box>
            <TextareaAutosize
              minRows={3}
              placeholder={i18next.t('boq-republish-reason-input')}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
            {disabled && (
              <Typography sx={{ color: clinkRed, fontSize: '12px' }}>
                {i18next.t('boq-republish-reason-validation')}
              </Typography>
            )}
          </Box>
        )}
      </ContentModal>
    </ConfirmModal>
  );
};

export default Modal;
