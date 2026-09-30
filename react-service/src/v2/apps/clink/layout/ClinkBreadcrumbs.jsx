import React from 'react';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { Link as ReactRouter } from 'react-router-dom';
import { CONSTANTS } from 'clink-components';
import ProjectMenu from './project-menu';

const { clinkPurple } = CONSTANTS.colors.general;

const { proxima } = CONSTANTS.fonts;

const MuiBreadcrumbs = ({ items = [], noReact = false }) => {
  return (
    <Breadcrumbs
      sx={{
        '& .MuiLink-root': {
          color: clinkPurple,
          textDecoration: 'underline!important',
          fontSize: '16px',
        },
        '& .MuiBreadcrumbs-separator': { color: clinkPurple },
      }}
      separator="/"
      aria-label="breadcrumb"
    >
      {items.map((item) => {
        const props = noReact
          ? {
              href: item.href,
            }
          : {
              to: item.href,
              component: ReactRouter,
            };
        return (
          (item && item.href && (
            <Link
              key={`${item.label}-${item.href}`}
              underline="hover"
              {...props}
            >
              {item.label}
            </Link>
          )) ||
          null
        );
      })}
    </Breadcrumbs>
  );
};

const RenderBreadcrumbs = ({
  loaded = false,
  items = [],
  title = '',
  noReact = false,
}) =>
  loaded ? (
    <>
      <MuiBreadcrumbs items={[...items]} noReact={noReact} />
      <Typography
        component="h1"
        sx={{
          fontSize: '32px !important',
          fontWeight: '600 !important',
          fontFamily: `${proxima} !important`,
        }}
      >
        {title}
      </Typography>
      <ProjectMenu />
    </>
  ) : (
    <Skeleton variant="rectangular" width={1210} height={120} />
  );

const ClinkBreadcrumbs = ({
  items = [],
  title = '',
  loaded = false,
  noReact = false,
}) => {
  return (
    <RenderBreadcrumbs
      items={items}
      title={title}
      loaded={loaded}
      noReact={noReact}
    />
  );
};

export default ClinkBreadcrumbs;
