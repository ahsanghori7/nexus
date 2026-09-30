import React, { useState } from 'react';
import { connect } from 'react-redux';
import isString from 'lodash/isString';
import flag from 'v2/helpers/flags';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import downloadPrequal from 'v1/global/helpers/getPrequalDoc';
import { getUrl, goToNewTab } from 'v2/helpers/url';
import { httpHelperV2 } from 'v2/services/httpHelper';
import SupplyChainHelper from 'v1/supply-chain-v2/helpers';
import { SubcontractorModal2 } from 'v1/supply-chain-v2/components/page/header/v2';
import Edit from './Edit';

const Actions = ({
  hasProperAccount,
  row,
  removeData,
  editData,
  regions,
  trades,
  accountData,
  accountType,
  setAlertOpen,
  users,
  clinkAccount,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openEdit2, setOpenEdit2] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const isAssistant = Number(accountType) === 4;
  const { t } = useTranslation();

  const handleOpenEdit2 = () => setOpenEdit2(true);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleConfirmOpen = () => {
    setOpenConfirm(true);
  };

  const handleConfirmClose = () => {
    setOpenConfirm(false);
  };

  const handleDownload = () => {
    if (hasProperAccount) {
      downloadPrequal(users?.account_id);
    }
  };

  const handleViewProfile = () => {
    if (hasProperAccount) {
      const url = getUrl(
        'CLINK_APP_HOST',
        `/main-contractor/supply_chain/${users?.account_id}?return=sc`,
      );
      goToNewTab(url);
    }
  };

  // TODO: Refactor to stay DRY
  const handleActivationReminder = () => {
    const accountIdForReminder = users?.account_id ?? row?.id;
    httpHelperV2({
      url: `account/supply-chain/${clinkAccount.id}/account/${accountIdForReminder}/activate_reminder`,
      method: 'PATCH',
    })
      .then((result) => {
        const failMessage = t('send-reminder-fail');
        let newMessage = result?.data?.status
          ? `${t('send-reminder-success')} to ${
              users?.display_name
            } -  ${users?.email}`
          : `${failMessage} to ${users?.display_name} -  ${users?.email}`;

        const statusIsString = isString(result?.data?.status);
        if (statusIsString) {
          switch (result?.data?.status) {
            case 'foundRecent':
              newMessage = t('send-reminder-limit');
              break;
            case 'notActivated':
              newMessage = `${failMessage}. ${t('send-reminder-not-activated')}`;
              break;
            case 'Activated':
              newMessage = `${failMessage}. ${t('send-reminder-activated')}`;
              break;
            case 'notExternal':
              newMessage = `${failMessage}. ${t('send-reminder-not-external')}`;
              break;
            default:
              newMessage = failMessage;
              break;
          }
        }

        setAlertOpen({
          severity:
            !result?.data?.status || statusIsString ? 'warning' : 'success',
          open: true,
          message: newMessage,
        });
      })
      .catch((e) => {
        setAlertOpen({
          severity: 'error',
          open: true,
          message: `${t('send-reminder-error')} - ${e}`,
        });
      });
  };

  const handleSendReminder = () =>
    httpHelperV2({
      url: `account/supply-chain/${clinkAccount.id}/account/${users?.account_id}/pqq_reminder`,
      method: 'PATCH',
    })
      .then((result) => {
        const failMessage = t('send-reminder-fail');
        let newMessage = result?.data?.status
          ? `${t('send-reminder-success')} to ${
              users?.display_name
            } -  ${users?.email}`
          : `${failMessage} to ${users?.display_name} -  ${users?.email}`;

        const statusIsString = isString(result?.data?.status);
        if (statusIsString) {
          switch (result?.data?.status) {
            case 'foundRecent':
              newMessage = t('send-reminder-limit');
              break;
            case 'notActivated':
              newMessage = `${failMessage}. ${t('send-reminder-not-activated')}`;
              break;
            case 'Activated':
              newMessage = `${failMessage}. ${t('send-reminder-activated')}`;
              break;
            case 'notExternal':
              newMessage = `${failMessage}. ${t('send-reminder-not-external')}`;
              break;
            default:
              newMessage = failMessage;
              break;
          }
        }

        setAlertOpen({
          severity:
            !result?.data?.status || statusIsString ? 'warning' : 'success',
          open: true,
          message: newMessage,
        });
      })
      .catch((e) => {
        setAlertOpen({
          severity: 'error',
          open: true,
          message: `${t('send-reminder-error')} - ${e}`,
        });
      });

  return (
    <Box>
      <IconButton onClick={handleMenuOpen}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        className="sc-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {hasProperAccount && (
          <MenuItem className="sc-menu-item" onClick={handleViewProfile}>
            {t('sc-view-profile')}
          </MenuItem>
        )}
        <Edit accountType={accountType} handleClick={handleOpenEdit2} />
        {!isAssistant && hasProperAccount && (
          <MenuItem className="sc-menu-item" onClick={handleDownload}>
            {t('sc-download-preq-pdf')}
          </MenuItem>
        )}
        {!hasProperAccount && (
          <MenuItem className="sc-menu-item" onClick={handleActivationReminder}>
            {t('send-activation-reminder')}
          </MenuItem>
        )}
        {flag('SEND_PQQ') && hasProperAccount && (
          <MenuItem className="sc-menu-item" onClick={handleSendReminder}>
            {t('send-pqq-reminder')}
          </MenuItem>
        )}
        {!isAssistant && (
          <MenuItem className="sc-menu-item-red" onClick={handleConfirmOpen}>
            {t('sc-remove')}
          </MenuItem>
        )}
      </Menu>

      <SubcontractorModal2
        formData={row}
        editData={editData}
        regions={regions}
        trades={trades}
        initialPage={1}
        hasAccount={
          row?.hasAccount ||
          Number(row?.type) === Number(SupplyChainHelper.subClinkNetwork())
        }
        title={t('sc-edit-sub')}
        subtitle={t('sc-enter-company')}
        accountData={accountData}
        externalState={[openEdit2, setOpenEdit2]}
      />

      {/* Confirm Remove Modal */}
      <Dialog open={openConfirm} onClose={handleConfirmClose}>
        <DialogTitle>{t('sc-remove')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('sc-remove-question')}</DialogContentText>
        </DialogContent>
        <DialogActions variant="sc-actions">
          <Button onClick={handleConfirmClose} variant="sc-cancel">
            {t('cancel')}
          </Button>
          <Button
            onClick={() => {
              removeData(row);
              handleConfirmClose();
            }}
            variant="sc-confirm"
            autoFocus
          >
            {t('sc-remove-confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
});

export default connect(mapStateToProps)(Actions);
