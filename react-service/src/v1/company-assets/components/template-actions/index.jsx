import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import SubMenuSVG from 'v1/global/public/images/svg/submenu-dropdown.svg';
import { getUrl } from 'v2/helpers/url';

const prefix = BASE_URLS.DOCUMENT_CREATOR || '';
const transformLabel = {
  orders: 'order',
  tenders: 'tender',
};

const TemplateActions = ({
  row,
  typeAsset,
  onDeleteClick,
  onRenameClick,
  onEditClick,
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const openTemplate = () => {
    const documentURL = `${prefix}/template/${row.id}`;
    const url = getUrl('CLINK_APP_HOST', documentURL);
    if (url) {
      window.open(url, '_blank');
    }
    handleClose();
  };

  const handleRename = () => {
    handleClose();
    onRenameClick(row);
  };

  return (
    <>
      <IconButton sx={{ width: 24, height: 24 }} onClick={handleClick}>
        <SubMenuSVG />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={openTemplate}>
          {`View ${transformLabel[typeAsset]} document`}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onEditClick(row);
          }}
        >
          {t('edit')}
        </MenuItem>
        <MenuItem onClick={handleRename}>{t('rename')}</MenuItem>

        {row?.inUse ? (
          <Tooltip title={t('sow-no-delete')}>
            <span>
              <MenuItem disabled>{t('delete')}</MenuItem>
            </span>
          </Tooltip>
        ) : (
          <>
            <MenuItem
              onClick={() => {
                onDeleteClick(row);
              }}
            >
              {t('delete')}
            </MenuItem>
            {/* Todo: remove this, once functionality from backend is added */}
            <Tooltip title={t('sow-no-delete')}>
              <span>
                <MenuItem disabled>testing delete tooltip</MenuItem>
              </span>
            </Tooltip>
          </>
        )}
      </Menu>
    </>
  );
};

export {
  TemplateActions,
};
