import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import DescriptionIcon from '@mui/icons-material/Description';
import i18next from 'helpers/i18n';
import EmptyState from 'v2/apps/shared/components/empty-state';
import { successGreen } from 'v2/constants/colors';

const Empty = ({ slug, isFiltered = false }) => {
  const quotesUrl = `${BASE_URLS.CLINK}/project/${slug}/quotes_tender`;
  const emptyStateProps = isFiltered
    ? {
        variant: 'search',
        title: i18next.t('no-results-found'),
        description: i18next.t('adjust-filters-search'),
      }
    : {
        variant: 'firstUse',
        title: i18next.t('no-recommendations-available'),
        description: i18next.t('tender-recommendations-empty-description'),
        icon: <DescriptionIcon sx={{ color: successGreen }} />,
        primaryAction: {
          label: i18next.t('go-to-quotes-and-analysis'),
          onClick: () => {
            window.open(quotesUrl, '_blank', 'noopener,noreferrer');
          },
        },
      };

  return (
    <Box data-testid="tr-empty-state">
      <EmptyState {...emptyStateProps} sx={{ width: '100%' }} />
    </Box>
  );
};

Empty.propTypes = {
  slug: PropTypes.string.isRequired,
  isFiltered: PropTypes.bool,
};

export default Empty;
