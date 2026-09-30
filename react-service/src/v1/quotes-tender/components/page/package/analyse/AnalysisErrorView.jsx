import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import i18next from 'v2/helpers/i18n';

/** Human-readable labels for API error_type (snake_case). Fallback: title-case. */
const ERROR_TYPE_LABELS = {
  token_limit: 'Token limit',
  pdf_page_limit: 'PDF page limit',
  insufficient_files: 'Insufficient files',
  ai_service: 'AI service',
  document_processing: 'Document processing',
  processing_failure: 'Processing failure',
  storage: 'Storage',
  network: 'Network',
  database: 'Database',
  json_processing: 'JSON processing',
  rate_limit: 'Rate limit',
  system_error: 'Server error',
  processing: 'Processing',
};

function getErrorTypeDisplayLabel(errorType) {
  if (!errorType || typeof errorType !== 'string') return '';
  const label = ERROR_TYPE_LABELS[errorType];
  if (label) return label;
  return errorType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Renders the analysis modal error state for FAILURE/UNPROCESSABLE API responses.
 * Uses normalized view model from normalizeAnalysisError().
 */
const AnalysisErrorView = ({
  primaryMessage,
  suggestions = [],
  errorType,
  technicalDetails,
  onRetry,
}) => {
  const [retrying, setRetrying] = useState(false);
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
  const errorTypeLabel = errorType ? getErrorTypeDisplayLabel(errorType) : '';

  const handleRetry = () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    Promise.resolve(onRetry()).finally(() => setRetrying(false));
  };

  return (
    <Box
      sx={{
        p: 3,
        pt: 1.5,
        maxWidth: 560,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}
      role="region"
      aria-label="Analysis error"
    >
      <Alert
        severity="error"
        sx={{
          borderRadius: 1.5,
          py: 1.25,
          px: 2,
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {errorTypeLabel && (
            <Chip
              label={errorTypeLabel}
              size="small"
              variant="outlined"
              sx={{
                alignSelf: 'flex-start',
                fontWeight: 600,
                fontSize: '0.75rem',
                borderColor: 'error.dark',
                color: 'error.dark',
              }}
            />
          )}
          <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1}}>
            {primaryMessage}
          </Typography>
        </Box>
      </Alert>

      {safeSuggestions.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: '0.02em'}}
          >
            {i18next.t('suggestions')}
          </Typography>
          <List
            dense
            disablePadding
            sx={{
              listStyle: 'disc',
              pl: 2.5,
              '& .MuiListItem-root': { display: 'list-item', py: 0 },
            }}
          >
            {safeSuggestions.map((suggestion) => (
              <ListItem key={suggestion} disableGutters>
                <ListItemText
                  primary={suggestion}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.primary',
                    sx: { lineHeight: 1.5 },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {technicalDetails && (
        <Accordion
          sx={{
            boxShadow: 'none',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            '&:before': { display: 'none' },
            '&.Mui-expanded': { margin: 0 },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" color="text.secondary">
              {i18next.t('technical-details', 'Technical details')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, pb: 1.5, pl: 0, pr: 2 }}>
            <Typography
              component="pre"
              variant="caption"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                color: 'text.secondary',
                lineHeight: 1.5,
              }}
            >
              {technicalDetails}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      {onRetry && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleRetry}
          disabled={retrying}
          sx={{ alignSelf: 'flex-start', mt: 0.5, minWidth: 140 }}
        >
          {retrying
            ? i18next.t('retrying', 'Retrying…')
            : i18next.t('retry-analysis', 'Retry analysis')}
        </Button>
      )}
    </Box>
  );
};

AnalysisErrorView.propTypes = {
  primaryMessage: PropTypes.string.isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.string),
  errorType: PropTypes.string,
  technicalDetails: PropTypes.string,
  onRetry: PropTypes.func,
};

AnalysisErrorView.defaultProps = {
  suggestions: [],
  errorType: undefined,
  technicalDetails: undefined,
  onRetry: undefined,
};

export default AnalysisErrorView;
