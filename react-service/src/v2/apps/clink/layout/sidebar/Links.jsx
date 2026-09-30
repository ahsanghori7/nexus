import React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import PieChartIcon from '@mui/icons-material/PieChart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import CalculateIcon from '@mui/icons-material/Calculate';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';

const main = [
  {
    label: 'Projects',
    icon: <HomeIcon />,
    url: '/main-contractor',
  },
  {
    label: 'Admin & Settings',
    icon: <AdminPanelSettingsIcon />,
    url: '/admin/settings',
    target: '_self',
  },

  {
    label: 'Supply Chain',
    icon: <PrecisionManufacturingIcon />,
    url: '/main-contractor/supply_chain',
  },
  {
    label: 'Cost Planning Tool',
    icon: <CalculateIcon />,
    url: '/main-contractor/cost-planning-tool',
    target: '_self',
  },
];

const companyAssets = [
  {
    label: 'Company Assets',
    icon: <PieChartIcon />,
    url: '/main-contractor/company-assets',
  },
];

const secondary = [
  {
    label: 'Help & Support',
    icon: <LiveHelpIcon />,
    url: 'https://knowledge.c-link.com/en/guides',
    target: '_blank',
  },
];

export { main, secondary, companyAssets };
