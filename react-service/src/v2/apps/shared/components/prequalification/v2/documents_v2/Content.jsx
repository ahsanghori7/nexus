import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { CONSTANTS, Image } from 'clink-components';
import { getUrl, goToNewTab } from 'v2/helpers/url';
import { expiredDate } from 'v2/helpers/date';
import ImageContainer from './ImageContainer';

const { white, black } = CONSTANTS.colors.general;
const { laceVeil } = CONSTANTS.colors.prosper;

const Content = ({
  aid,
  idDoc = 0,
  icon = '',
  iconLabel = '',
  date = '',
  title = '',
  document = '',
  fileName = '',
  extra = {},
  children,
  type,
  contextType
}) => (
  <>
    <Grid
      item
      sx={{ alignItems: 'center', display: 'flex', flexBasis: '84px' }}
    >
      <Tooltip title={fileName} placement="bottom">
        {/* Div was added for Tooltip to work properly  */}
        <div>
          <ImageContainer
            onClick={() =>
              Boolean(document) &&
              goToNewTab(
                getUrl(
                  'APP_PROSPER',
                  `/relay/v1/prequalification/${aid}/download/${idDoc}`,
                ),
              )
            }
            extra={{
              backgroundColor: expiredDate(new Date(date)) ? white : laceVeil,
              cursor: 'pointer',
              ...extra,
            }}
          >
            <Box>
              <Image src={icon} />
              {Boolean(iconLabel) && (
                <Typography sx={{ fontSize: '10px', marginTop: '5px' }}>
                  {iconLabel}
                </Typography>
              )}
            </Box>
          </ImageContainer>
        </div>
      </Tooltip>
    </Grid>
    <Grid
      container
      item
      sx={{
        fontSize: '16px',
        color: black,
        flexBasis: 'calc(100% - 80px)',
        pl: { md: '12px !important', lg: '24px !important' },
      }}
    >
      {contextType !== 'clink' && (
        <Grid item xs={12}>
          <Typography
            sx={{
              fontSize: '16px',
              lineHeight: '1.7',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </Typography>
        </Grid>
      )}
      {children}
    </Grid>
  </>
);

export default Content;
