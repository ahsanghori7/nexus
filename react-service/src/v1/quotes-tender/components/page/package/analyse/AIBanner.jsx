import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { CONSTANTS } from 'clink-components';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import i18next from 'v2/helpers/i18n';
import AIInfoTooltip, { getAIIconColor } from './AIInfoTooltip';

const {
  black,
  aiEmptyBg,
  aiEmptyBorder,
  aiEmptyChipBg,
  aiEmptyChipLabel,
  aiIneligibleBg,
  aiIneligibleBorder,
  aiIneligibleChipBg,
  aiIneligibleChipLabel,
  aiEligibleBg,
  aiEligibleBorder,
  aiEligibleChipBg,
  aiEligibleChipLabel,
} = CONSTANTS.colors.general;

const AIBanner = ({
  aiState,
  reasons = [],
  tid,
  showBetaChip = true,
  embedded = false,
  showTooltipTrigger = true,
}) => {
  const existingData = JSON.parse(localStorage.getItem('analyseQuote')) || [];
  const analysisStarted = existingData.includes(tid);

  const getBannerLabel = () => {
    switch (aiState) {
      case 'eligible':
        return i18next.t('eligible-label');
      case 'ineligible':
        return i18next.t('ineligible-label');
      case 'empty':
      default:
        return i18next.t('empty-label');
    }
  };

  const bannerStyles = useMemo(() => {
    const base = {
      borderWidth: 1,
      borderRadius: embedded ? '12px' : 3,
      padding: '10px 16px',
      marginBottom: embedded ? 0 : '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent:
        embedded || !showTooltipTrigger ? 'flex-start' : 'space-between',
      marginTop: embedded ? 0 : '10px',
      ...(embedded
        ? {
            width: 'fit-content',
            maxWidth: '100%',
            gap: 2,
            flexWrap: 'nowrap',
            overflow: 'visible',
          }
        : {}),
    };

    switch (aiState) {
      case 'eligible':
        return {
          ...base,
          border: `1px solid ${aiEligibleBorder}`,
          backgroundColor: aiEligibleBg,
        };
      case 'ineligible':
        return {
          ...base,
          border: `1px solid ${aiIneligibleBorder}`,
          backgroundColor: aiIneligibleBg,
        };
      case 'empty':
      default:
        return {
          ...base,
          border: `1px solid ${aiEmptyBorder}`,
          backgroundColor: aiEmptyBg,
        };
    }
  }, [aiState, embedded, showTooltipTrigger]);

  const textColor = black;
  const iconColor = getAIIconColor(aiState);

  const betaChipStyles = useMemo(() => {
    switch (aiState) {
      case 'eligible':
        return { bgcolor: aiEligibleChipBg, color: aiEligibleChipLabel };
      case 'ineligible':
        return { bgcolor: aiIneligibleChipBg, color: aiIneligibleChipLabel };
      case 'empty':
      default:
        return { bgcolor: aiEmptyChipBg, color: aiEmptyChipLabel };
    }
  }, [aiState]);

  if (
    !embedded &&
    analysisStarted
  ) {
    return null;
  }

  if (embedded && analysisStarted && aiState === 'eligible') {
    return null;
  }

  return (
    <Box sx={bannerStyles} data-embedded={embedded ? 'true' : undefined}>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        sx={embedded ? { flexShrink: 0, minWidth: 0 } : undefined}
      >
        {(!embedded || !showTooltipTrigger) && (
          <InfoOutlinedIcon
            sx={{
              fontSize: 16,
              color: iconColor,
              flexShrink: 0,
            }}
            aria-hidden
          />
        )}
        <Typography
          component="span"
          sx={{
            color: textColor,
            fontWeight: 500,
            fontSize: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: embedded ? 'nowrap' : 'wrap',
          }}
        >
          {getBannerLabel()}
          {showBetaChip && (
            <Chip
              label={i18next.t('beta-chip')}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 600,
                ...betaChipStyles,
                borderRadius: 1,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}
        </Typography>
      </Box>

      {showTooltipTrigger && (
        <Box sx={{ flexShrink: 0 }}>
          <AIInfoTooltip aiState={aiState} reasons={reasons} />
        </Box>
      )}
    </Box>
  );
};

export default AIBanner;
