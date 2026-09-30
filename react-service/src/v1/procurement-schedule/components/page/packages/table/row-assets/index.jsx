import React from 'react';
import isNil from 'lodash/isNil';
import Container from 'react-bootstrap/Container';
import { GreenButton } from '../../../general-ui';
import { Award } from '../../../../../public/images/icons/svg/supply_actions';
import SubActions, {
  CustomToolbar,
  CustomToolbarSelect,
  CustomCheckbox,
  TYPE_ENQUIRY,
  UID_ACCEPTED,
  getStatusLabel,
} from './actions';
import LazyImage from '../../../../../../global/components/LazyImage';
import SupplyChainHelper from '../../../../../../supply-chain-v2/helpers';

const UID_AWARDED = 'awarded';
const UID_TENDER_RECEIVED = 'tender_received';
const NO_ID = 0;
const AWARDED_ID = 7;
const Status = ({
  status,
  formattedStatusLabel,
  lastAction = {},
  packageAwarded = false,
  meta = {},
}) => {
  const isAwarded = Boolean(packageAwarded);
  if (!isAwarded && isNil(formattedStatusLabel)) {
    return null;
  }
  const { id, uid } = status;
  const { created_at: createdAt } = lastAction;
  const { document } = meta;
  return (
    <ul
      data-testid={`subcontractor-status-${id}`}
      style={{ paddingLeft: 0 , marginTop: 15 }}
      className={`status${isAwarded ? ' status__package-awarded' : ''}`}
    >
      {isAwarded ? (
        <li className="status__package-awarded-icon">
          <Award /> Package awarded
        </li>
      ) : (
        <li className={`status__${uid}`}>{formattedStatusLabel}</li>
      )}
      {!isAwarded && createdAt && (
        <li className="status__date">Last updated {createdAt}</li>
      )}
      {uid === UID_TENDER_RECEIVED && document && (
        <GreenButton
          id={`status-${id}`}
          className="review-tender"
          label="Review Tender"
          plusIcon={false}
          type="link"
          hred={document.path}
          target="_blank"
        />
      )}
    </ul>
  );
};

const Title = ({
  subcontractor,
  className = 'packages-component__title',
  children = null,
}) => {
  const { name, logo } = subcontractor;
  return (
    <Container data-testid="subcontractor-title" className={className}>
      {logo && <LazyImage alt="img" src={logo} />}
      <div className="title-copy">{name}</div>
      {children && <div className="extra-content">{children}</div>}
    </Container>
  );
};

const formattedAwardedTo = (packageAwardedTo, subcontractors) => {
  const { name, id } = packageAwardedTo;
  if (isNil(id)) {
    return [
      {
        sub_id: NO_ID,
        name,
        logo: null,
        type_id: SupplyChainHelper.subExternal(),
        status: {
          id: AWARDED_ID,
          clink_label: 'Awarded Package',
          uid: UID_AWARDED,
        },
      },
    ];
  }
  return subcontractors.filter(
    (subcontractor) => Number(subcontractor.sub_id) === Number(id),
  );
};

export {
  SubActions as Actions,
  Title,
  Status,
  formattedAwardedTo,
  CustomToolbar,
  CustomToolbarSelect,
  CustomCheckbox,
  UID_AWARDED,
  TYPE_ENQUIRY,
  UID_ACCEPTED,
  getStatusLabel,
};
