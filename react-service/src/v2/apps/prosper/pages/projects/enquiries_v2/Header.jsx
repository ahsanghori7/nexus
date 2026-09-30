import React from 'react';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import { CONSTANTS } from 'clink-components';
import AIBadge from './components/AIBadge';

const { japaneseIndigo } = CONSTANTS.colors.general;
const { dimGray } = CONSTANTS.colors.prosper;

const Header = ({
  title,
  subheader,
  ActionCollapse = null,
  showAIBadge = false,
}) => (
  <CardHeader
    action={ActionCollapse}
    title={
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        {title}
        {showAIBadge && (
          <AIBadge />
        )}
      </Box>
    }
    subheader={subheader}
    sx={{ textAlign: 'start' }}
    titleTypographyProps={{
      fontSize: '12px',
      color: dimGray,
      fontWeight: 'bold',
    }}
    subheaderTypographyProps={{
      fontSize: '16px',
      color: japaneseIndigo,
      fontWeight: 'bold',
    }}
  />
);
export default Header;
