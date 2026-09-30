import React from 'react';
import PropTypes from 'prop-types';
import { Link as ReactRouter } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { CONSTANTS } from 'clink-components';

const { clinkLightPurple, clinkPurple } = CONSTANTS.colors.general;

const item = {
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
};

const content = {
  margin: '8px',
  height: '210px',
  border: `1px solid ${clinkLightPurple}`,
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: clinkLightPurple,
    borderColor: clinkPurple,
    borderWidth: '2px',
    '& > div': {
      borderColor: clinkPurple,
      borderWidth: '1px',
    },
  },
};

const head = {
  width: '100%',
  height: '56%',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  borderBottom: `1px solid ${clinkLightPurple}`,
  alignItems: 'center',
  justifyContent: 'center',

  span: {
    width: '100%',
    height: '100%',
    display: 'flex !important',
    justifyContent: 'center',
    alignItems: 'center',
    img: {
      '&.no-image-found': {
        maxWidth: '56px',
        height: 'auto',
      },
      '&.project-image': {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: '6px',
        borderTopRightRadius: '6px',
      },
    },
  },
};

const bodyStyle = {
  padding: '12px 18px',
  flexDirection: 'column',
};

const Item = ({
  children = '',
  image = null,
  body = null,
  href = '',
  addProject = false,
}) => {
  const Wrapper = href ? ReactRouter : 'span';
  const wrapperProps = href ? { to: href } : {};

  return (
    <Grid item sx={item} xs={12} sm={4} md={3} lg={2} position="relative">
      <Wrapper {...wrapperProps} style={{ textDecoration: 'none' }}>
        <Box
          sx={{
            ...content,
            ...(addProject ? { border: '1px solid #4cc0ad' } : {}),
          }}
        >
          <Grid
            container
            sx={{
              ...head,
              ...(addProject ? { borderBottom: '1px solid #4cc0ad' } : {}),
            }}
          >
            {image}
          </Grid>
          <Grid container sx={bodyStyle}>
            {body}
          </Grid>
        </Box>
      </Wrapper>
      {children}
    </Grid>
  );
};

Item.propTypes = {
  /** Any React nodes to be rendered as children of the Item component */
  children: PropTypes.node,
  /** React node to be rendered in the image section */
  image: PropTypes.node,
  /** React node to be rendered in the body section */
  body: PropTypes.node,
  /** URL string for React Router navigation */
  href: PropTypes.string,
  /** Boolean flag to indicate if this is an add project item */
  addProject: PropTypes.bool,
};

Item.defaultProps = {
  children: '',
  image: null,
  body: null,
  href: '',
  addProject: false,
};

export default Item;
