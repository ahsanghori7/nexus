import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { CONSTANTS } from 'clink-components';

const { white, darkJungleGreen, japaneseIndigo, lightPeriwinkle, tealShade } = CONSTANTS.colors.general;
const { prosperBoxGreen } = CONSTANTS.colors.prosper;
const styleDefault = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  textAlign: 'center',
  transform: 'translate(-50%, -50%)',
  width: 335,
  minHeight: 150,
  color: white,
  bgcolor: darkJungleGreen,
  border: '0',
  borderRadius: '5px',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
};
const cancelButton = {
  bgcolor: tealShade,
  color: white,
  marginRight: '8px',
  verticalAlign: 'middle',
  border: `1px solid ${tealShade}`,
};
const acceptButton = {
  backgroundColor: prosperBoxGreen,
  color: white,
  verticalAlign: 'middle',
};
const titleText = {
  fontWeight: 'bold',
};
const descriptionText = {
  mt: 2,
};
const headerStyle = {
  bgcolor: white,
  borderTopLeftRadius: 5,
  borderTopRightRadius: 5,
  boxShadow: 0,
  borderBottom: `1px solid ${lightPeriwinkle}!important`,
};


const Content = forwardRef(
  (
    {
      handleCancel = null,
      handleAccept = () => null,
      title = 'are-you-sure',
      navTitle = null,
      navTitleInterpolation = null,
      cancel = 'cancel',
      confirm = 'confirm',
      description = 'will-notify-clink-declined',
      extraDescription = null,
      fullWidth = false,
      style = styleDefault,
      cancelStyle = {},
      acceptStyle = {},
      titleStyle = {},
      descriptionStyle = {},
      /** When set, overrides default header title color (e.g. BoQ confirm uses accent teal) */
      navTitleColor = japaneseIndigo,
      children,
      disabled = false,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const widthProps = fullWidth ? {} : { width: 118 };
    const showHeader = Boolean(navTitle || handleCancel);
    let resolvedNavTitle = null;
    if (navTitle) {
      if (navTitleInterpolation) {
        resolvedNavTitle = t(navTitle, navTitleInterpolation);
      } else {
        resolvedNavTitle = t(navTitle);
      }
    }
    return (
      <Box tabIndex={-1} sx={{ ...styleDefault, ...style }} ref={ref}>
        {showHeader && (
          <AppBar position="static" sx={{ ...headerStyle }}>
            <Toolbar
              disableGutters
              sx={{
                px: 2,
                py: 1,
                minHeight: 56,
                width: '100%',
                boxSizing: 'border-box',
                justifyContent: navTitle ? 'space-between' : 'flex-end',
                alignItems: navTitle ? 'flex-start' : 'center',
                gap: 1,
              }}
            >
              {navTitle && (
                <Typography
                  component="div"
                  fontSize={20}
                  color={navTitleColor}
                  textAlign="left"
                  fontWeight="bold"
                  title={resolvedNavTitle}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    pt: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {resolvedNavTitle}
                </Typography>
              )}
              {handleCancel && (
                <IconButton
                  size="small"
                  edge="end"
                  aria-label="close"
                  sx={{ color: japaneseIndigo, flexShrink: 0, mt: -0.5 }}
                  onClick={handleCancel}
                >
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Toolbar>
          </AppBar>
        )}
        <Box tabIndex={-1} sx={{ padding: '20px' }} ref={ref}>
          {title && (
            <Typography
              id="modal-modal-title"
              variant="h6"
              component="h2"
              sx={{ ...titleText, ...titleStyle }}
            >
              {t(title)}
            </Typography>
          )}
          <Typography
            id="modal-modal-description"
            sx={{ ...descriptionText, ...descriptionStyle }}
          >
            {t(description)}
            {extraDescription}
          </Typography>
          {children && <Box mt={2}>{children}</Box>}
          <Box mt={2}>
            {handleCancel && cancel && (
              <Button
                sx={{
                  ...cancelButton,
                  ...widthProps,
                  ...cancelStyle,
                }}
                onClick={handleCancel}
                fullWidth={fullWidth}
              >
                {t(cancel)}
              </Button>
            )}
            {handleAccept && confirm && (
              <Button
                id="modal-accept-button"
                sx={{
                  ...acceptButton,
                  ...widthProps,
                  ...acceptStyle,
                }}
                onClick={handleAccept}
                fullWidth={fullWidth}
                disabled={disabled}
              >
                {t(confirm)}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    );
  }
);

export default Content;
export { acceptButton };
