import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { CONSTANTS } from 'clink-components';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import i18next from 'v2/helpers/i18n';

const {
  white,
  aiEmptyChipLabel,
  aiIneligibleChipLabel,
  aiEligibleIcon,
} = CONSTANTS.colors.general;

export const getAITooltipLabel = (aiState) => {
  switch (aiState) {
    case 'eligible':
      return i18next.t('eligible-tooltip');
    case 'ineligible':
      return i18next.t('ineligible-tooltip');
    case 'empty':
    default:
      return i18next.t('empty-tooltip');
  }
};

export const getAIIconColor = (aiState) => {
  switch (aiState) {
    case 'eligible':
      return aiEligibleIcon;
    case 'ineligible':
      return aiIneligibleChipLabel;
    case 'empty':
    default:
      return aiEmptyChipLabel;
  }
};

export const renderAITooltipContent = (aiState, reasons = []) => {
  if (aiState === 'eligible') {
    return (
      <Box sx={{ maxWidth: '50vw' }}>
        <Typography variant="subtitle2" sx={{ color: white, mb: 1, fontWeight: 600 }}>
          {i18next.t('tooltip-eligible-title')}
        </Typography>

        <Typography sx={{ color: white, fontSize: '11px', fontWeight: 600, mb: 0.5, opacity: 0.8 }}>
          {i18next.t('tooltip-eligible-section-filesize')}
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0, mb: 1, color: white, fontSize: '12px', lineHeight: 1.5 }}>
          <li>{i18next.t('tooltip-eligible-filesize-pdf')}</li>
          <li>{i18next.t('tooltip-eligible-filesize-word')}</li>
          <li>{i18next.t('tooltip-eligible-filesize-excel')}</li>
          <li>{i18next.t('tooltip-eligible-filesize-csv')}</li>
          <li>{i18next.t('tooltip-eligible-filesize-txt')}</li>
        </Box>

        <Typography sx={{ color: white, fontSize: '11px', fontWeight: 600, mb: 0.5, opacity: 0.8 }}>
          {i18next.t('tooltip-eligible-section-analysis')}
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0, mb: 1, color: white, fontSize: '12px', lineHeight: 1.5 }}>
          <li>{i18next.t('tooltip-eligible-analysis-total')}</li>
          <li>{i18next.t('tooltip-eligible-analysis-maxfiles')}</li>
          <li>{i18next.t('tooltip-eligible-analysis-maxpages')}</li>
        </Box>

        <Typography sx={{ color: white, fontSize: '11px', fontWeight: 600, mb: 0.5, opacity: 0.8 }}>
          {i18next.t('tooltip-eligible-section-notes')}
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0, color: white, fontSize: '12px', lineHeight: 1.5 }}>
          <li>{i18next.t('tooltip-eligible-notes-formats')}</li>
          <li>{i18next.t('tooltip-eligible-notes-boq')}</li>
          <li>{i18next.t('tooltip-eligible-notes-tradeonly')}</li>
          <li>{i18next.t('tooltip-eligible-notes-beta')}</li>
        </Box>
      </Box>
    );
  }

  if (aiState === 'ineligible') {
    const reasonItems = {
      insufficient_quotes: i18next.t('tooltip-ineligible-item1'),
      missing_docs: i18next.t('tooltip-ineligible-item2'),
      boq: i18next.t('tooltip-ineligible-item3'),
      max_quotes: i18next.t('tooltip-ineligible-item4'),
    };

    return (
      <Box sx={{ maxWidth: '50vw' }}>
        <Typography variant="subtitle2" sx={{ color: white, mb: 1, fontWeight: 600 }}>
          {i18next.t('tooltip-ineligible-title')}
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0, color: white, fontSize: '13px', lineHeight: 1.4 }}>
          {reasons.map((r) => (
            <li key={r}>{reasonItems[r] || 'Unknown reason'}</li>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '50vw' }}>
      <Typography variant="subtitle2" sx={{ color: white, mb: 1, fontWeight: 600 }}>
        {i18next.t('tooltip-empty-title')}
      </Typography>
      <Typography sx={{ color: white, mb: 1, fontSize: '13px', lineHeight: 1.4 }}>
        {i18next.t('tooltip-empty-description')}
      </Typography>
    </Box>
  );
};

/** @param {'state' | 'limitations'} variant - limitations: header Beta Limitations tip for all packages */
const AIInfoTooltip = ({ aiState, reasons = [], variant = 'state' }) => {
  const isLimitations = variant === 'limitations';
  const iconColor = isLimitations ? aiEligibleIcon : getAIIconColor(aiState);
  const label = isLimitations
    ? i18next.t('eligible-tooltip')
    : getAITooltipLabel(aiState);
  const tooltipContent = isLimitations
    ? renderAITooltipContent('eligible', [])
    : renderAITooltipContent(aiState, reasons);

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: { maxWidth: '50vw' },
        },
      }}
      aria-label={i18next.t('view-ai-results')}
    >
      <Box
        component="span"
        role="button"
        tabIndex={0}
        data-testid="ai-info-tooltip"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
          }
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          color: iconColor,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          opacity: 1,
          visibility: 'visible',
          '&:hover .ai-info-tooltip-label': {
            textDecoration: 'underline',
          },
        }}
      >
        <Typography
          className="ai-info-tooltip-label"
          component="span"
          sx={{ fontSize: 14, fontWeight: 500, color: iconColor }}
        >
          {label}
        </Typography>
        <InfoOutlinedIcon
          sx={{
            fontSize: 16,
            color: iconColor,
            flexShrink: 0,
            opacity: 1,
            visibility: 'visible',
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default AIInfoTooltip;
