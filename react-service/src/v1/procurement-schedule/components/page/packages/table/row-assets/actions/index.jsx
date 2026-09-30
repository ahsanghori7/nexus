import React, { useState } from 'react';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import downloadPrequal from 'v1/global/helpers/getPrequalDoc';
import Subscription from 'v2/helpers/user/subscription';
import Button from 'react-bootstrap/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Dropdown from 'react-bootstrap/Dropdown';
import isNil from 'lodash/isNil';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import { getProjectUrl, getUrl, goToNewTab } from 'v2/helpers/url';
import { GreenButton } from 'v1/procurement-schedule/components/page/general-ui';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';
import Delete from './Delete';
import {
  SubmenuEdit,
  SubmenuClose,
  SubmenuDropdown,
  Projects,
} from 'v1/procurement-schedule/public/images/icons/svg/supply_actions';
import ProjectService from 'v1/procurement-schedule/services/project';
import SupplyChainHelper from 'v1/supply-chain-v2/helpers';
import TenderLog from './tender-log';
import EnquiryPro from './enquiry-pro';

const { clinkPurple } = CONSTANTS.colors.general;

const service = new ProjectService();
const UID_DISMISSED = 'dismissed';
const UID_AWARDED = 'awarded';
const UID_DELETED = 'deleted';
const UID_ACCEPTED = 'accepted';
const UID_ADDED = 'added';
const TYPE_ENQUIRY = 'Enquiry';
const LIST_LAST_COUPLE = 2;

const ShowTenderOption = ({ handleClick }) => (
  <MenuItem onClick={handleClick}>{i18next.t('send-tender-addendum')}</MenuItem>
);

const DropdownMenu = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const {
    pid,
    tid,
    subId,
    subName,
    isCustom,
    subcontractors,
    formattedStatusLabel,
    initialValues,
    callback,
    slug,
    packageData,
  } = props;
  const [subItems, setSubItems] = useState(subcontractors);
  const [onlySubcontractor] = subcontractors;
  if (onlySubcontractor.status.uid === UID_DISMISSED) {
    return null;
  }

  const delayClose = () =>
    setTimeout(() => {
      handleMenuClose();
    }, 500);
  return (
    <>
      <IconButton
        data-testid={`sub-actions-menu-btn-${subId}`}
        onClick={handleMenuOpen}
        sx={{ border: `2px solid ${clinkPurple}` }}
      >
        <SubmenuDropdown />
      </IconButton>
      <Menu
        data-testid={`sub-actions-menu-${subId}`}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          root: {
            sx: {
              zIndex: 1040,
            },
          },
        }}
      >
        <EnquiryPro
          pid={pid}
          tid={tid}
          subId={subId}
          isCustom={isCustom}
          subcontractors={subItems}
          initialValues={initialValues}
          setSubcontractors={setSubItems}
          callback={callback}
          slug={slug}
          onHide={delayClose}
          packageData={packageData}
        />
        {!isNil(formattedStatusLabel) && (
          <EnquiryPro
            title={i18next.t('send-tender-addendum')}
            pid={pid}
            tid={tid}
            isCustom={isCustom}
            subcontractors={subItems}
            setSubcontractors={setSubItems}
            initialValues={initialValues}
            callback={callback}
            ShowButton={ShowTenderOption}
            tenderAddendum
            slug={slug}
            onHide={delayClose}
            packageData={packageData}
          />
        )}
        <TenderLog
          tid={tid}
          subId={subId}
          subName={subName}
          handleMenuClose={delayClose}
        />
      </Menu>
    </>
  );
};

const subscriptionHelper = new Subscription();
const ShowProfile = ({ subId, subscriptionId, slug }) => {
  if (!subscriptionId || subscriptionHelper.isExternal(subscriptionId)) {
    return null;
  }
  const url = getUrl(
    'CLINK_APP_HOST',
    `/main-contractor/supply_chain/${subId}?return=ps&slug=${slug}`,
  );
  const goProfile = () => goToNewTab(url);
  return (
    <div className="actions-tooltip">
      <Button data-testid={`sub-actions-profile-btn-${subId}`} size="sm" variant="outline-primary" onClick={goProfile}>
        <Projects />
      </Button>
      <div className="actions-tooltip-text view-profile-2">View profile</div>
    </div>
  );
};
const SubActions = ({
  subcontractor,
  formattedStatusLabel,
  projectData,
  packageAwarded,
  initialValues,
  packageData,
  isCustom,
  callback,
  listSize,
  listIndex,
  slug,
}) => {
  const { checkFeature } = useFeatureFlag();
  const isShortlistedSubcontractorEnabled = checkFeature(
    'SUBCONTRACTOR_LIST_APPROVAL',
  );

  const {
    name,
    sub_id: subId,
    type_id: typeId,
    status,
    type,
    subscription_id: subscriptionId,
  } = subcontractor;
  const { uid } = status;
  const isEndingList = listSize - listIndex <= LIST_LAST_COUPLE;
  const hasProperAccount =
    subId && typeId && !subscriptionHelper.isExternal(typeId);
  const handleClick = () => (hasProperAccount ? downloadPrequal(subId) : null);

  const showRemove = type !== TYPE_ENQUIRY || uid === UID_ADDED;
  return (
    <div className="supply-chain-actions">
      <ShowProfile subscriptionId={subscriptionId} subId={subId} slug={slug} />
      {Number(typeId) !== SupplyChainHelper.subExternal() &&
        hasProperAccount && (
          <div className="actions-tooltip">
            <Button data-testid={`sub-actions-prequal-btn-${subId}`} size="sm" variant="outline-primary" onClick={handleClick}>
              <SubmenuEdit />
            </Button>
            <div className="actions-tooltip-text view-profile">
              Download prequal
            </div>
          </div>
        )}
      {!packageAwarded && showRemove && !isShortlistedSubcontractorEnabled && (
        <div className="actions-tooltip">
          <Delete
            subcontractor={subcontractor.name}
            handleClick={() => {
              const data = {
                pid: projectData.id,
                type,
                status: UID_DELETED,
                tid: packageData.id,
                sid: subId,
              };
              const optionsSuccess = {
                title: 'They’re on!',
                message:
                  'The selected subcontractors have been removed to your schedule.',
                type: 'success',
              };
              return service.updateProjectHistory(
                data,
                callback,
                true,
                'GET',
                {},
                optionsSuccess,
              );
            }}
          >
            <SubmenuClose />
          </Delete>
          <div className="actions-tooltip-text delete">Delete</div>
        </div>
      )}
      {!packageAwarded && uid !== UID_AWARDED && (
        <div className="actions-tooltip">
          <DropdownMenu
            direction={isEndingList ? 'up' : 'down'}
            pid={projectData.id}
            tid={packageData.id}
            subId={subId}
            subName={name}
            isCustom={isCustom}
            subcontractors={[subcontractor]}
            formattedStatusLabel={formattedStatusLabel}
            initialValues={initialValues}
            callback={callback}
            slug={slug}
            packageData={packageData}
          />
          <div className="actions-tooltip-text more-options">More Options</div>
        </div>
      )}
    </div>
  );
};

function getAllArrayIndexes(subcontractors) {
  const indexes = [];
  let i;
  for (i = 0; i < subcontractors.length; i++) {
    if (subcontractors[i].status.uid === UID_DISMISSED) {
      indexes.push(i);
    }
  }
  return indexes;
}

const CustomCheckbox = (props) => {
  const newProps = { ...props };
  const FIRST = 0;
  const rowType = 'row-select';
  const {
    subcontractors,
    'data-description': dataDescription,
    'data-index': dataIndex,
  } = newProps;
  if (dataDescription === rowType) {
    const formattedDataIndex = isNil(dataIndex) ? FIRST : dataIndex;
    const dismissedSubcontractors = getAllArrayIndexes(subcontractors);
    if (dismissedSubcontractors.includes(formattedDataIndex)) {
      newProps.disabled = true;
    }
  }
  return <Checkbox {...newProps} />;
};

function getStatusLabel(subcontractor) {
  const { status, type } = subcontractor;
  const { uid, clink_label: clinkLabel } = status;
  return uid === UID_ACCEPTED && type !== TYPE_ENQUIRY ? null : clinkLabel;
}

const CustomToolbarSelect = ({
  selectedRows,
  displayData,
  pid,
  tid,
  isCustom,
  callback,
  initialValues,
  slug,
  packageData,
}) => {
  const selectedKeys = selectedRows.data.map((row) => row.index);
  let selectedSubcontractors = displayData
    .flatMap((row) => {
      const [first] = row.data;
      return first.props.subcontractor;
    })
    .filter((_, index) => selectedKeys.includes(index));
  const dismissedSubcontractors = getAllArrayIndexes(selectedSubcontractors);
  selectedSubcontractors = selectedSubcontractors.filter(
    (_, arrayIndex) => !dismissedSubcontractors.includes(arrayIndex),
  );
  const selectedSubsForTenderAddendum = selectedSubcontractors.filter(
    (sub) => !isNil(getStatusLabel(sub)),
  );

  return (
    <div className="MUIDataTableToolbarSelect-custom">
      <Dropdown>
        <Dropdown.Toggle id="package-bulk-actions">
          Bulk actions
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <EnquiryPro
            pid={pid}
            tid={tid}
            isCustom={isCustom}
            subcontractors={selectedSubcontractors}
            initialValues={initialValues}
            callback={callback}
            slug={slug}
            packageData={packageData}
          />
          {Boolean(selectedSubsForTenderAddendum.length) && (
            <EnquiryPro
              title={i18next.t('send-tender-addendum')}
              pid={pid}
              tid={tid}
              isCustom={isCustom}
              subcontractors={selectedSubsForTenderAddendum}
              initialValues={initialValues}
              callback={callback}
              ShowButton={ShowTenderOption}
              tenderAddendum
              slug={slug}
              packageData={packageData}
            />
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

const CustomToolbar = ({
  slug,
  tid,
  hasDocument,
  accountInfo,
}) => {
  const { features = [] } = accountInfo;
  const hasBoq =
    features &&
    Boolean(features.length) &&
    features.filter((f) => f.name && f.name.toLowerCase() === 'boq');
  const flagBoq = hasBoq && Boolean(hasBoq.length);
  if (flagBoq) {
    return null;
  }
  const params = { tid };
  if (hasDocument) {
    params.tender_addendum = 'true';
  }

  const url = getProjectUrl(slug, `issue_enquiry`, params);
  const label = !hasDocument
    ? 'Create Tender Document'
    : 'Create Tender Addendum';

  return (
    <Box display="flex" justifyContent="right">
        <GreenButton
          data-testid="create-tender-btn"
          className="create-tender-document"
          type="link"
          label={label}
          plusIcon={false}
          href={url}
          target="_blank"
        />
      </Box>
  );
};

export default SubActions;
export {
  CustomToolbar,
  CustomToolbarSelect,
  CustomCheckbox,
  TYPE_ENQUIRY,
  getStatusLabel,
  UID_ACCEPTED,
};
