import * as React from 'react';
import { fetchData } from 'services/clinkHelpers';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import i18next from 'v2/helpers/i18n';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Subscription from 'v2/helpers/user/subscription';
import downloadPrequal from 'v1/global/helpers/getPrequalDoc';
import Relay from 'v1/global/services/Relay';
import httpRequest from 'services/httpHelper';
import { goToNewTab } from 'v2/helpers/url';

const ITEM_HEIGHT = 48;
const contextType = 'clink';
const subscriptionHelper = new Subscription();

function QuoteMenu({ quoteInfo, pid, entity, dispatch = () => null }) {
  const context = useContext(contextType);
  const { actions } = context;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const ellipsis = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const { subcontractor } = quoteInfo;
  const { id, type_id: typeId } = subcontractor;
  const hasProperAccount =
    id && typeId && !subscriptionHelper.isExternal(typeId);
  const viewPrequalDocument = () =>
    hasProperAccount ? downloadPrequal(id) : null;

  const { compliant } = quoteInfo;
  const label = compliant ? 'mark-as-non-compliant' : 'mark-as-compliant';
  const isCompliant = compliant === 0;
  const qid = quoteInfo.id;
  const tid = quoteInfo.tender_id;

  const toggleCompliance = () =>
    dispatch(
      actions.changeCompliance({
        toggle: isCompliant,
        pid,
        tid,
        id: qid,
      })
    );
  const options = [
    {
      label: i18next.t('view-prequalification-document'),
      action: viewPrequalDocument,
    },
    { label: i18next.t(label), action: toggleCompliance },
    {
      label: i18next.t('download-quote-revision'),
      action: () => {
        fetchData('boq', 'checkRevisionDocument', {
          sid: subcontractor.id,
          eid: entity.id,
        }).then((result) => {
          if (result && result.data && result.data.success) {
            goToNewTab(result.data.file);
          } else {
            /* eslint no-alert: "off" */
            alert((result && result.data && result.data.error) || 'ERROR');
          }
        });
      },
    },
    {
      label: i18next.t('view-quote-document'),
      action: () => {
        httpRequest({
          url: `boq/${entity.id}/quote/${subcontractor.id}/download`,
        }).then((result) => {
          if (result && result.data && result.data.success) {
            goToNewTab(result.data.file);
          } else {
            /* eslint no-alert: "off" */
            alert((result && result.data && result.data.error) || 'ERROR');
          }
        });
      },
    },
  ];
  const { order_created, meta } = quoteInfo;

  if (order_created && meta) {
    const { order_template_id: orderId } = JSON.parse(meta);
    if (orderId) {
      const downloadOrderRelay = new Relay('transaction', 'downloadOrder', {
        id: orderId,
        pid,
      });
      const func = () =>
        downloadOrderRelay.getJson().then((j) => {
          if (j.error && j.status === 'archived') {
            /* eslint no-alert: "off" */
            alert('Archived');
          } else {
            window.open(j.url, '_blank');
          }
        });
      const viewOrder = {
        label: i18next.t('view-order'),
        action: func,
      };
      options.push(viewOrder);
    }
  }

  return (
    <div style={{ textAlign: 'right' }}>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '20ch',
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.label} onClick={option.action}>
            <Tooltip title={option.label}>
              <Box sx={ellipsis}>{option.label}</Box>
            </Tooltip>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

export default connect()(QuoteMenu);
