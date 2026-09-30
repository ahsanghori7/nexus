import { CONSTANTS } from 'clink-components';
import { creationCardActionButtonSx } from 'v2/apps/clink/pages/boq/container/containerStyles';

const { black, clinkLightPurple, brightGray, white } = CONSTANTS.colors.general;

const startFromScratchCardSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  p: 2,
};

const startFromScratchCardDisabledSx = {
  opacity: 0.5,
  pointerEvents: 'none',
};

const startFromScratchIconBoxSx = {
  width: '72px',
  height: '72px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: brightGray,
  mb: 2,
};

const startFromScratchIconSx = {
  color: black,
  opacity: 0.55,
  fontSize: 36,
};

const startFromScratchTitleSx = {
  fontSize: '15px',
  fontWeight: 'bold',
  color: black,
  mb: 0.5,
};

const startFromScratchDescriptionSx = {
  fontSize: '13px',
  color: black,
  opacity: 0.6,
};

const startFromScratchAddIconSx = {
  color: black,
  opacity: 0.7,
  fontSize: 18,
};

const startFromScratchActionButtonSx = {
  ...creationCardActionButtonSx,
  color: black,
  backgroundColor: white,
  borderColor: clinkLightPurple,
  '&:hover': {
    backgroundColor: white,
    borderColor: clinkLightPurple,
  },
};

export {
  startFromScratchCardSx,
  startFromScratchCardDisabledSx,
  startFromScratchIconBoxSx,
  startFromScratchIconSx,
  startFromScratchTitleSx,
  startFromScratchDescriptionSx,
  startFromScratchAddIconSx,
  startFromScratchActionButtonSx,
};
