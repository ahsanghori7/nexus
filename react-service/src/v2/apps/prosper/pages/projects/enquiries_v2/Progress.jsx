import React from 'react';
import isString from 'lodash/isString';
import { useTranslation } from 'react-i18next';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { Image, CONSTANTS } from 'clink-components';
import { getStatus, getProgress } from 'v2/helpers/status/enquiries';
import AIAnalysisButton from './components/AIAnalysisButton';


const { japaneseIndigo } = CONSTANTS.colors.general;
const { prosperDisabledBg } = CONSTANTS.colors.prosper;

const StepIconComponent = ({ completed, active, Icon, DarkIcon, bgColor }) => {

  return (
    <Avatar
      sx={{
        width: 25,
        height: 25,
        bgcolor: completed || active ? bgColor : prosperDisabledBg,
      }}
    >
      {isString(Icon) ? (
        <Image src={completed || active ? DarkIcon : Icon} />
      ) : (
        <Icon sx={{ fontSize: '1rem' }} />
      )}
    </Avatar>
  );
};


const Progress = ({
  data,
  showAIButton = false,
  onAIAnalysisClick = null,
  hasViewedAIResults = false,
  aiButtonDisabled = false,
  aiButtonTooltipTitle = null,
}) => {
  const { t } = useTranslation();
  const status = getStatus(data);
  const progressList = getProgress(status);

  return (
    <Box sx={{ maxWidth: 450 }}>
      {Boolean(data) && (
        <Stepper
          data-testid="enquiry-progress"
          activeStep={status ? status.index : null}
          orientation="vertical"
          sx={{ padding: '16px' }}
        >
          {progressList.map((s) => {
            const Icon = s.icon;
            const DarkIcon = s.dark;
            const bgColor = s.bg;
            const isTenderStep = s.label === 'text-tender-specs-received' && status && status.index >= 2;
            return (
              <Step key={s.label}>
                <StepLabel
                  sx={{ padding: 0 }}
                  slots={{ stepIcon: StepIconComponent }}
                  slotProps={{
                    stepIcon: {
                      Icon,
                      DarkIcon,
                      bgColor,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                    <span>{t(s.label).toUpperCase()}</span>
                    {isTenderStep && showAIButton && onAIAnalysisClick && (
                      <AIAnalysisButton
                        hasViewed={hasViewedAIResults}
                        onClick={onAIAnalysisClick}
                        disabled={aiButtonDisabled}
                        tooltipTitle={aiButtonTooltipTitle}
                      />
                    )}
                  </Box>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      )}
      {status.status === 'UNSUCCESSFUL' && (
        <Typography
          pt={1}
          pb={1}
          pl={4}
          pr={4}
          sx={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 'normal',
            color: japaneseIndigo,
            textAlign: 'start',
          }}
        >
          {t('unsuccessful-text')}
        </Typography>
      )}
    </Box>
  );
};

export default Progress;
