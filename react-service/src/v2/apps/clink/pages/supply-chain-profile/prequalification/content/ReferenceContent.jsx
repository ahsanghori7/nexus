import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import { CONSTANTS, Image } from 'clink-components';
import { getUrl } from 'v2/helpers/url';
import Doc from 'v2/apps/shared/components/prequalification/v2/Doc';
import Content from 'v2/apps/shared/components/prequalification/v2/documents_v2/Content';
import {
  getReferenceStatus,
  getPreqNonRefDocStatus,
} from 'v2/apps/shared/components/prequalification/v2/references';
import { metricSystemFormat } from 'v2/helpers/currency';
import Requester from 'v2/apps/clink/pages/supply-chain-profile/prequalification/content/Requester';
import { MuiAccreditationLabel } from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';
import { TYPES, SECTIONS } from 'v2/helpers/prequal/documents';
import i18next from 'v2/helpers/i18n';
import { expiredDate } from 'v2/helpers/date';
import ExpirationDate from 'v2/apps/clink/pages/supply-chain-profile/prequalification/ExpirationDate';

const { iconDownloadGray } = CONSTANTS.s3;
const { webOrange, darkCharcoal, bostonRed, transparentGray } =
  CONSTANTS.colors.general;
const { proxima } = CONSTANTS.fonts;
const { prosperBoxGreen } = CONSTANTS.colors.prosper;

const refContentSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  width: '100%',
  height: {
    xs: '92%',
    sm: '91%',
  },
  top: '0',
  textAlign: 'center',
  paddingTop: '4px',
  borderRadius: '3px',
  background: webOrange,
  fontSize: '14px',
  fontWeight: '600',
  fontFamily: proxima,
  color: darkCharcoal,
  cursor: 'pointer',
  zIndex: 9999,
};

const Wrapper = ({ children, docData, docAid, docType }) => {
  const isNonReferenceType = [
    TYPES.QU,
    TYPES.ED,
    TYPES.HS,
    TYPES.HSEQ,
    TYPES.EN,
  ].includes(docType);
  const showRequesterForNonReferenceTypes =
    isNonReferenceType &&
    (!docData?.section || expiredDate(new Date(docData?.date)));

  if (showRequesterForNonReferenceTypes) {
    return (
      <Requester
        type={docType}
        withSpan
        full
        sx={{
          ...refContentSx,
          backgroundColor: alpha(transparentGray, 0.3),
          '#open-modal-wrapper--label': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: webOrange,
            width: '140px',
            height: '22px',
            borderRadius: '3px',
            position: 'relative',
          },
        }}
        data={docData}
        aid={docAid}
      >
        {children}
      </Requester>
    );
  }
  return children;
};

const ReferenceContent = ({
  aid,
  data,
  type,
  contextType,
  showExpiredInfo = true,
}) => {
  const { t } = useTranslation();
  const referenceStatus = getReferenceStatus(data.status, true);
  const [status, setStatus] = useState(referenceStatus);
  const theme = useTheme();
  const largeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const typoStyle = { fontSize: '14px' };
  const icon = status.icon;
  const iconLabel = status.label;

  useEffect(() => {
    if ([TYPES.QU, TYPES.ED, TYPES.HS, TYPES.HSEQ, TYPES.EN].includes(type)) {
      const exampleDocumentStatus = getPreqNonRefDocStatus(data);
      setStatus(exampleDocumentStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    Boolean(data) && (
      <>
        <MuiAccreditationLabel>{data.label}</MuiAccreditationLabel>
        <Wrapper docData={data} docAid={aid} docType={type}>
          <Doc
            variant="outlined"
            extra={{
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'unset' },
              justifyContent: { xs: 'center', sm: 'unset' },
              textAlign: { xs: 'center', sm: 'unset' },
            }}
          >
            <Content
              type={type}
              contextType={contextType}
              aid={aid}
              title={data.label}
              idDoc={data.id}
              icon={icon}
              iconLabel={iconLabel}
              date={data.date}
              document={data.document}
              fileName={data.original_file}
              extra={{
                display: 'flex',
                backgroundColor: status.bg,
                color: status.color,
                '& span': {
                  display: 'flex !important',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                ...(type === TYPES.ED && {
                  '& p': {
                    whiteSpace: 'nowrap',
                  },
                }),
              }}
            >
              <Grid item xs={12}>
                {type === SECTIONS.REF && (
                  <Typography
                    sx={{
                      fontSize: { xs: '14px', sm: '18px' },
                      fontWeight: 'bold',
                    }}
                  >
                    {data.project_name}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                {type === SECTIONS.REF && (
                  <Typography sx={typoStyle}>
                    {t('value')}
                    <br />
                    {Boolean(data && data.contract_value) &&
                      metricSystemFormat(data.contract_value)}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={8}>
                {type === SECTIONS.REF && (
                  <Typography sx={typoStyle}>
                    {t('references-completion_date')}
                    <br />
                    {Boolean(data.completion_date) &&
                      String(
                        moment(new Date(data.completion_date)).format(
                          'MM/YYYY',
                        ),
                      )}
                  </Typography>
                )}
              </Grid>
            </Content>
            {type === SECTIONS.REF && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: largeScreen ? 'end' : 'start',
                }}
              >
                <IconButton
                  aria-label="Download reference document"
                  sx={{
                    '& span': {
                      display: 'flex !important',
                      justifyContent: 'center',
                      ml: { xs: 1, sm: 0 },
                    },
                  }}
                  href={getUrl(
                    'app_clink',
                    `/relay?action=prequalification&method=downloadReference&subcontractor=${aid}&id=${data.id}`,
                  )}
                >
                  <Image src={iconDownloadGray} />
                </IconButton>
              </Box>
            )}
          </Doc>
        </Wrapper>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', minHeight: '18px' }}
        >
          {showExpiredInfo && (
            <ExpirationDate
              date={data.date}
              expiresOnLabel={`${i18next.t('expiry-renewal-date')}:`}
              expirationDateFontSize="12px"
              notExpired={prosperBoxGreen}
              expirationColor={bostonRed}
              expirationDateColor={bostonRed}
            />
          )}
        </Box>
      </>
    )
  );
};

export default ReferenceContent;
