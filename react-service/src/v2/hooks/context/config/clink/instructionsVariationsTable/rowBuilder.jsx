import React from 'react';
import Box from '@mui/material/Box';
import i18next from 'v2/helpers/i18n';
import { Badge } from 'clink-components';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import CLinkDropdown from 'v2/apps/shared/components/clink-dropdown';
import { getEditUrl, getPreviewLink } from 'v2/apps/clink/helpers';
import { StyledContentSubcontractorName } from './styled';

const dropdownActions = (action, linkEdit, linkPreview) => {
  let options = [];
  if (linkEdit) {
    options = [{ id: 1, link: linkEdit, label: 'Edit' }];
  }
  if (action) {
    options = [...options, { id: 2, action, label: 'Delete' }];
  }
  return [
    ...options,
    { id: 3, link: linkPreview, newTab: true, label: 'View Document' },
  ];
};

const rowBuilder = ({ data, deleteAction, slug, dropdownOffset }) => {
  const {
    id,
    nr,
    status,
    date,
    subcontractor,
    description,
    price,
    type,
    tender,
  } = data;

  const labelSub =
    subcontractor && subcontractor.name ? subcontractor.name : '';
  const labelPack = tender && tender.label ? tender.label : '';
  const isSent = status.id === 1;
  const color = isSent ? 'orange' : 'gray';
  const ContentInstruction = (
    <div className="instruction-nr">
      <span>{nr}</span>
      <Badge text={status.label || ''} color={color} />
    </div>
  );
  const ContentSubcontractorName = (
    <StyledContentSubcontractorName className="instruction-sub">
      <p className="instruction-sub__name">{labelSub}</p>
      <p className="instruction-sub__label">{labelPack}</p>
    </StyledContentSubcontractorName>
  );

  const linkEdit = !isSent ? getEditUrl(slug, type.uid, id) : '';
  const actionRemove = !isSent ? deleteAction : null;

  const linkPreview = getPreviewLink(type.uid, id);
  return {
    id,
    instruction: ContentInstruction,
    date,
    subcontractor: ContentSubcontractorName,
    description,
    price: parseCurrency(price, currencyConfig[i18next.t('currency')]),
    actions: (
      <Box
        sx={{
          '&> .clink-dropdown-container': {
            '&> .clink-dropdown-open': {
              padding: '0px !important',
            },
          },
        }}
      >
        <CLinkDropdown
          dropdownCssClass="left-align"
          dropdownContentWidth={170}
          xOffset={dropdownOffset}
          dropdownItems={dropdownActions(actionRemove, linkEdit, linkPreview)}
        />
      </Box>
    ),
  };
};

export default rowBuilder;
