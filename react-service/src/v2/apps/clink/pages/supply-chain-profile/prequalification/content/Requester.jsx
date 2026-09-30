import React, { useState } from 'react';
import { CONSTANTS, Image } from 'clink-components';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { MuiModal } from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';

const { proxima } = CONSTANTS.fonts;
const { requestIcon } = CONSTANTS.s3;
const { white, japaneseIndigo, razzmatazz, clinkRed, magnesium } =
  CONSTANTS.colors.general;
// TODO: Work on themes for MUI
const buttonSx = {
  background: `${clinkRed} 0% 0% no-repeat padding-box`,
  border: `1px solid ${razzmatazz}`,
  borderRadius: '66px',
  letterSpacing: '0.0px',
  color: white,
  '&:hover': {
    color: japaneseIndigo,
  },
  fontFamily: proxima,
  fontSize: '18px',
  opacity: 1,
  width: '112px',
  height: '48px',
  marginBottom: 2,
};
const textSx = {
  textAlign: 'center',
  fontFamily: proxima,
  fontSize: '12px',
  letterSpacing: '0px',
  color: japaneseIndigo,
  opacity: 1,
};

const requestedColor = {
  insurances: magnesium,
  accreditation: white,
  'management-system': white,
  'custom-certificate': white,
  quality: white,
  'example-documents': white,
  'health-safety': white,
  'health-safety-environmental-qualifications': white,
  environmental: white,
};
const renewal = 1;
const absent = 2;

const Span = ({ children, data, type, withSpan }) => {
  if (withSpan) {
    return (
      <span
        style={{
          ...(data?.request ? { background: requestedColor[type] } : {}),
        }}
        id="open-modal-wrapper--label"
      >
        {children}
      </span>
    );
  }
  return children;
};

const Requester = ({
  children,
  sx = {},
  wrapperSx = {},
  data = {},
  type = null,
  dispatch,
  full = false,
  withSpan = false,
  aid,
  extra = false,
}) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const context = useContext('clink');
  const { actions } = context;
  const { requestDocument_V2 } = actions;

  if (!type) {
    return children;
  }

  const id = data.date ? data.id : null;
  const request_type = data.date ? renewal : absent;
  const handleRequest = () =>
    data.request
      ? null
      : dispatch(
          requestDocument_V2({
            type,
            data: { ...data, id, request_type },
            aid,
          }),
        );
  const handleModalOpen = data.request ? () => null : setOpen;
  const label = data.request
    ? `${t('request')} ${t('sent').toLocaleLowerCase()}`
    : t('request');
  const props = {};
  let imgProps = {
    width: 40,
    height: 40,
  };
  if (full) {
    props.width = '100%';
  }
  if (type !== 'insurances') {
    imgProps = {
      width: 30,
      height: 29,
      style: {
        position: 'relative',
      },
    };
  }

  return (
    <Box id="big-wrapper" position="relative" {...props} sx={wrapperSx}>
      {children}
      <MuiModal
        externalSetOpen={[open, handleModalOpen]}
        openModal={
          <Box
            id="open-modal-wrapper"
            sx={{
              ...sx,
              ...(data.request ? { background: requestedColor[type] } : {}),
            }}
          >
            {!extra && (
              <Span withSpan={withSpan} data={data} type={type}>
                <Image src={requestIcon} {...imgProps} />{' '}
                <Typography
                  sx={{
                    fontSize: sx.fontSize,
                    fontWeight: sx.fontWeight,
                    fontFamily: sx.fontFamily,
                    color: sx.color,
                  }}
                >
                  {label}
                </Typography>
              </Span>
            )}
          </Box>
        }
        modalProps={{
          title: t('request-update'),
          dialogWidth: 260,
          titleProps: {
            sx: {
              textAlign: 'center',
              fontFamily: proxima,
              fontSize: '20px',
              letterSpacing: '0px',
              color: japaneseIndigo,
              opacity: 1,
            },
          },
          appBarProps: {
            sx: {
              boxShadow: 'none',
            },
          },
        }}
      >
        <Box textAlign="center" maxWidth="208px">
          <Button sx={buttonSx} onClick={handleRequest}>
            {t('request')}
          </Button>
          <Typography sx={textSx}>{t('request-modal')}</Typography>
        </Box>
      </MuiModal>
    </Box>
  );
};

const mapStateToProps = (state) => {
  return {
    prequalification: state.prequalificationV2,
  };
};

export default connect(mapStateToProps)(Requester);
