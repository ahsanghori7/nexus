import React from 'react';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { Image } from 'clink-components';

const UrlWrapper = ({ children, value, url }) =>
  url ? (
    <Link href={value} target="_blank" rel="noopener">
      {children}
    </Link>
  ) : (
    children
  );

const EmptyTextWrapper = ({ children, value, loading }) =>
  !value && loading ? (
    <Skeleton variant="rectangular" width="100%" height={20} />
  ) : (
    children
  );

const Item = ({
  icon,
  iconSize = 16,
  type,
  value,
  mb = 3,
  mt = null,
  xs = 12,
  url = false,
  gridSx = false,
  loading = false,
  fontSize = {
    xs: '12px',
    sm: '14px',
    md: '16px',
  },
  gridProp1 = { xs: 4 },
  gridProp2 = { xs: 8 },
}) => {
  const { t } = useTranslation();
  const props = {};
  if (xs) {
    props.xs = xs;
  }
  if (mt) {
    props.mt = mt;
  }
  if (gridSx) {
    props.sx = gridSx;
  }
  return (
    <Grid
      container
      item
      mb={mb}
      flexWrap="wrap"
      justifyContent="space-between"
      {...props}
    >
      <Grid
        item
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
        {...gridProp1}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ '> span': { width: iconSize, textAlign: 'center' } }}
        >
          <Image src={icon} />
          <Typography
            sx={{
              fontWeight: 200,
              whiteSpace: 'nowrap',
              fontSize,
            }}
          >
            {t(type)}
          </Typography>
        </Stack>
      </Grid>
      <Grid item display="contents" {...gridProp2}>
        <EmptyTextWrapper value={value} loading={loading}>
          <UrlWrapper value={value} url={url}>
            <Typography
              component="div"
              sx={{
                fontWeight: 'bold',
                fontSize,
              }}
            >
              {value}
            </Typography>
          </UrlWrapper>
        </EmptyTextWrapper>
      </Grid>
    </Grid>
  );
};

export default Item;
