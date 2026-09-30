import React from 'react';
import { useTranslation } from 'react-i18next';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

const Edit = ({ handleClick, accountType, label = false }) => {
  const { t } = useTranslation();
  const isAssistant = Number(accountType) === 4;

  if (isAssistant) {
    return (
      <MenuItem className="sc-menu-item disabled">
        <Tooltip
          className="sc-tooltip"
          placement="top"
          title={t('sc-edit-not')}
          arrow
        >
          {t('edit')}
        </Tooltip>
      </MenuItem>
    );
  }
  return (
    <MenuItem
      className="sc-menu-item sc-edit"
      layout="dropdown"
      align="left"
      onClick={handleClick}
    >
      {label || t('edit')}
    </MenuItem>
  );
};

export default Edit;
