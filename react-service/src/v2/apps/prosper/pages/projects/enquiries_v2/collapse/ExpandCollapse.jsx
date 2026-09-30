import React from 'react';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const ExpandCollapse = ({ expanded, handleChangeExpanded, id }) => (
  <ExpandMore
    data-testid={`expand-collapse-${id}`}
    expand={expanded.includes(id)}
    onClick={() => handleChangeExpanded(id)}
    aria-expanded={expanded.includes(id)}
    aria-label="show more"
  >
    <ExpandMoreIcon />
  </ExpandMore>
);

export default ExpandCollapse;
