import { CONSTANTS } from 'clink-components';

const { white, lightPeriwinkle } = CONSTANTS.colors.general;

const modalBoxStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'calc(100% - 40px)',
  maxWidth: '600px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  bgcolor: white,
  p: 0,
  borderRadius: 2,
  outline: 0,
  border: `1px solid ${lightPeriwinkle}`,
};

const modalHeaderStyle = {
  py: 2,
  px: 4,
  borderBottom: `1px solid ${lightPeriwinkle}`,
  flexShrink: 0,
};

const modalBodyStyle = {
  p: 4,
  pt: 2,
  overflowY: 'auto',
  flex: 1,
  minHeight: 0,
};

const modalFooterStyle = {
  px: 4,
  py: 2,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 2,
  borderTop: `1px solid ${lightPeriwinkle}`,
  flexShrink: 0,
};

export { modalBoxStyle, modalHeaderStyle, modalBodyStyle, modalFooterStyle };
