import React from 'react';
import { CONSTANTS } from 'clink-components';
import PropTypes from 'prop-types';
import Link from '@mui/material/Link';
import capitalize from 'lodash/capitalize';
import isNil from 'lodash/isNil';
import isArray from 'lodash/isArray';
import { useTranslation } from 'react-i18next';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import { getStatus } from 'v2/helpers/status/enquiries';


const getStatusColor = (id) => {
  switch (Number(id)) {
    case 1:
    case 5:
    case 6:
      return 'error'; // danger
    case 4:
      return 'secondary'; // pink
    case 2:
      return 'primary'; // black
    case 3:
      return 'primary'; // prosper-black
    case 9:
      return 'purple'; // prosper-purple
    case 7:
      return 'success'; // prosper-green
    default:
      return '';
  }
};

const { prosperBoxRed } = CONSTANTS.colors.prosper;

const EnquiryCard = ({ item, link }) => {
  // Removed theme prop, styling will be handled by MUI
  const { t } = useTranslation();

  let doc =
    item?.document?.order ||
    item?.document?.tender_addendum ||
    item?.document?.enquiry ||
    null;

  if (isArray(doc) && doc.length) {
    doc = doc[doc.length - 1];
  }

  const documentId = doc?.id;
  const url = documentId ? `relay/v1/document/${documentId}/download` : '';

  const status = item ? getStatus(item) : null;
  const label = status?.label || '';

  const titleContainerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1, // Corresponds to spacing in MUI
  };

  const infoLineStyles = {
    marginBottom: 0.5, // Corresponds to spacing
    fontSize: '0.875rem', // Example size
    '& span': {
      fontWeight: 'bold', // Example for the value part
    },
  };

  const packageLinkStyles = {
    color: prosperBoxRed,
    fontWeight: 500,
    textDecorationColor: prosperBoxRed,
    '&:hover': {
      textDecorationColor: prosperBoxRed, // Ensure hover state also has the color
    },
  };

  const downloadLinkStyles = {
    marginTop: 1, // Spacing before the download link
    // Add other styles for the download link if needed
  };

  return (
    item && (
      <Card key={item.id} sx={{mb: 2}}>
        <CardContent>
          <Box sx={titleContainerStyles}>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
              {' '}
              {/* Changed h1 to h6 for semantics, adjust as needed */}
              {item.contractor}
            </Typography>
            {Boolean(item.status_id) && (
              <Chip
                label={capitalize(t(label))}
                size="small"
                color={getStatusColor(item.status_id)}
              />
            )}
          </Box>
          <Typography sx={infoLineStyles}>
            {capitalize(t('label-project'))}: <Typography component='span' color='success'>{item.project}</Typography>
          </Typography>
          <Typography sx={infoLineStyles}>
            {capitalize(t('label-package-s'))}:{' '}
            {link ? (
              <Link
                href={link}
                sx={packageLinkStyles}
                className="value" // Retain class if used elsewhere for styling/testing
              >
                {item.package}
              </Link>
            ) : (
              <span className="value">{item.package}</span>
            )}
          </Typography>
        </CardContent>
        {!isNil(documentId) && (
          <CardActions sx={{ justifyContent: 'flex-start', paddingTop: 0 }}>
            <Link
              href={url}
              disabled={isNil(documentId)}
              sx={downloadLinkStyles}
              underline="hover"
            >
              {capitalize(t('text-download-documents'))}
            </Link>
          </CardActions>
        )}
      </Card>
    )
  );
};

EnquiryCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    contractor: PropTypes.string.isRequired,
    status_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    project: PropTypes.string.isRequired,
    package: PropTypes.string.isRequired,
    document: PropTypes.shape({
      order: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
      tender_addendum: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
      enquiry: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    }),
  }).isRequired,
  link: PropTypes.string,
  // theme: PropTypes.string, // Removed theme prop
};

export default EnquiryCard;
