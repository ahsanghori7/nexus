import React from 'react';
import PropTypes from 'prop-types';
import Link from '@mui/material/Link';
import capitalize from 'lodash/capitalize';
import isNil from 'lodash/isNil';
import isArray from 'lodash/isArray';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Card,
  CardBody,
  CardInfoLine,
  CardLink,
  CardTitle,
  CONSTANTS,
} from 'clink-components';
import { getStatus } from 'v2/helpers/status/enquiries';
import getStatusColor from 'v2/helpers/enquiryStatusColors';

const { prosperBoxRed } = CONSTANTS.colors.prosper;

const EnquiryCard = ({ item, link, theme = 'prosper-enquiries-small' }) => {
  const { t } = useTranslation();

  let doc =
    item?.document?.order ||
    item?.document?.tender_addendum ||
    item?.document?.enquiry || null;

  if (isArray(doc) && doc.length) {
    doc = doc[doc.length - 1];
  }

  const documentId = doc?.id;
  const url = documentId ? `relay/v1/document/${documentId}/download` : '';

  const status = item ? getStatus(item) : null;
  const label = status?.label || '';

  return (
    item && (
      <Card key={item.id} theme={theme}>
        <CardBody theme={theme}>
          <CardTitle theme={theme}>
            <h1>{item.contractor}</h1>
            {Boolean(item.status_id) && (
              <Badge
                text={capitalize(t(label))}
                color={getStatusColor(item.status_id)}
              />
            )}
          </CardTitle>
          <CardInfoLine theme={theme}>
            {capitalize(t('label-project'))}: <span>{item.project}</span>
          </CardInfoLine>
          <CardInfoLine theme={theme}>
            {capitalize(t('label-package-s'))}:{' '}
            {link ? (
              <Link
                sx={{
                  color: prosperBoxRed,
                  fontWeight: 500,
                  textDecorationColor: prosperBoxRed,
                }}
                href={link}
                className="value"
              >
                {item.package}
              </Link>
            ) : (
              <span className="value">{item.package}</span>
            )}
          </CardInfoLine>
          <CardLink href={url} theme={theme} disabled={isNil(documentId)}>
            {!isNil(documentId) && capitalize(t('text-download-documents'))}
          </CardLink>
        </CardBody>
      </Card>
    )
  );
};

EnquiryCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    contractor: PropTypes.string,
    package: PropTypes.string,
    status_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    document: PropTypes.shape({
      order: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
      tender_addendum: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
      enquiry: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    }),
  }),
  link: PropTypes.string,
  theme: PropTypes.string,
};

export default EnquiryCard;
