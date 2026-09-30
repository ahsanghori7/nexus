import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, CONSTANTS, HOOKS } from 'clink-components';
import { StyledTooltip, StyledTooltipContainer } from './styled';

const { infoLogoBlack, infoLogoGray } = CONSTANTS.s3;
const { LG_SCREEN } = CONSTANTS.dimensions;
const { useWindowDimensions } = HOOKS;

const InfoTooltip = ({ matched = false, closed = false }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const dimensions = useWindowDimensions();
  const infoLogo = dimensions.width <= LG_SCREEN ? infoLogoBlack : infoLogoGray;
  return (
    <StyledTooltipContainer matched={matched} closed={closed}>
      <StyledTooltip className="prosper-tooltip-content" open={open}>
        <div className="prosper-tooltip-content-row">
          {t('total-number-explanation')}
        </div>
      </StyledTooltip>
      <div
        aria-hidden="true"
        className="prosper-tooltip-trigger"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
      >
        <Image src={infoLogo} alt="Count of registered interests" />
      </div>
    </StyledTooltipContainer>
  );
};

export default InfoTooltip;
