import React from 'react';
import capitalize from 'lodash/capitalize';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { Image, CONSTANTS } from 'clink-components';
import { LogoContainer } from './LogoContainer.styled';

const { blueMagentaViolet } = CONSTANTS.colors.general;

const EmptyTextWrapper = ({ children, value, loading }) =>
  !value && loading ? (
    <Skeleton variant="rectangular" width="100%" height={20} />
  ) : (
    children
  );

const About = ({
  title = 'characteristics',
  description,
  displayName,
  jobTitle,
  src,
  gridSx = {},
  descSx = {},
  fontTitleSx = { fontSize: { xs: '14px', md: '19px' }, fontWeight: 'bold' },
  descriptionSX = {
    fontSize: { xs: '14px', md: '16px' },
    fontWeight: 200,
    width: '100%',
    marginTop: 1,
  },
  loading = false,
  children,
}) => {
  const { t } = useTranslation();
  return (
    <Grid sx={gridSx} container item flexDirection="column" flexWrap="nowrap">
      <Grid item pt={1}>
        <Typography sx={fontTitleSx}>{capitalize(t(title))}</Typography>
      </Grid>
      <Grid
        container
        item
        spacing={2}
        pt={1}
        sx={{
          alignItems: 'center',
          display: 'flex',
        }}
      >
        {src && (
          <Grid item>
            <LogoContainer>
              <Image src={src} width={63} height={63} />
            </LogoContainer>
          </Grid>
        )}
        <Grid item>
          <EmptyTextWrapper value={displayName} loading={loading}>
            <Typography
              variant="secondary"
              mb="2px"
              sx={{
                fontSize: { xs: '14px', md: '18px' },
                fontWeight: 'bold',
                color: blueMagentaViolet,
              }}
            >
              {displayName}
            </Typography>
          </EmptyTextWrapper>
          <EmptyTextWrapper value={jobTitle}>
            <Typography
              sx={{ fontSize: { xs: '12px', md: '14px' }, fontWeight: 200 }}
            >
              {jobTitle}
            </Typography>
          </EmptyTextWrapper>
        </Grid>
        <Grid item sx={descSx}>
          <EmptyTextWrapper value={description}>
            {' '}
            <Typography component="div" sx={descriptionSX}>
              {description}
            </Typography>
          </EmptyTextWrapper>
        </Grid>
      </Grid>
      {children && (
        <Grid container item xs={8} sm={8} md={10} lg={10} mb={4}>
          {children}
        </Grid>
      )}
    </Grid>
  );
};

export default About;
