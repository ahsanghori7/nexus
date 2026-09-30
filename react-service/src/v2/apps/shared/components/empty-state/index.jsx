import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TableChartIcon from '@mui/icons-material/TableChart';
import { useTranslation } from 'react-i18next';
import { darkLightGrey, successGreen, errorRed } from 'v2/constants/colors';
import {
  IconBox,
  ActionButton,
  OuterBox,
  InnerBox,
} from './EmptyStateComponents';

const ICONS = {
  generic: <DescriptionIcon sx={{ color: darkLightGrey }} />,
  search: <SearchIcon sx={{ color: darkLightGrey }} />,
  firstUse: <FolderOpenIcon sx={{ color: successGreen }} />,
  error: <ErrorOutlineIcon sx={{ color: errorRed }} />,
  table: <TableChartIcon sx={{ color: darkLightGrey }} />,
};

const DEFAULT_TEXT = {
  generic: {
    title: 'no-records-found',
    description: 'no-data-display',
  },
  search: {
    title: 'no-results-found',
    description: 'adjust-filters-search',
  },
  firstUse: {
    title: 'no-items-added',
    description: 'add-first-item',
  },
  error: {
    title: 'something-went-wrong',
    description: 'load-information-error',
  },
  table: {
    title: 'no-records-table',
    description: 'no-rows-display',
  },
};

const EmptyState = ({
  variant = 'generic',
  size = 'default',
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  iconBackgroundColor,
  sx,
}) => {
  const { t } = useTranslation();

  const defaults = DEFAULT_TEXT[variant];
  const displayTitle = title || t(defaults.title);
  const displayDescription = description || t(defaults.description);
  const displayIcon = icon || ICONS[variant];

  return (
    <OuterBox sx={sx}>
      <InnerBox size={size} variant={variant}>
        <IconBox
          icon={displayIcon}
          variant={variant}
          backgroundColor={iconBackgroundColor}
        />

        {displayTitle && (
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 0.5, fontSize: '14px' }}
          >
            {displayTitle}
          </Typography>
        )}

        {displayDescription && (
          <Typography
            variant="body2"
            sx={{ color: darkLightGrey, maxWidth: 400, fontSize: '14px' }}
          >
            {displayDescription}
          </Typography>
        )}

        {(primaryAction || secondaryAction) && (
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ mt: 2 }}>
            {primaryAction && (
              <ActionButton action={primaryAction} variant="contained" />
            )}
            {secondaryAction && (
              <ActionButton action={secondaryAction} variant="outlined" />
            )}
          </Stack>
        )}
      </InnerBox>
    </OuterBox>
  );
};

EmptyState.propTypes = {
  variant: PropTypes.oneOf(['generic', 'search', 'firstUse', 'error', 'table']),
  size: PropTypes.oneOf(['small', 'default', 'large']),
  title: PropTypes.string,
  description: PropTypes.string,
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType,
  }),
  icon: PropTypes.node,
  iconBackgroundColor: PropTypes.string,
  sx: PropTypes.object,
};

export default EmptyState;
