import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { CONSTANTS } from 'clink-components';
import ActionsTable from './ActionsTable';
import i18next from 'helpers/i18n';

const { clinkLightPurple, white } = CONSTANTS.colors.general;

const DashboardTabs = ({
  dashboardActions = {},
  clinkAccount,
  fetchDashboardActions,
  dispatchRemoveOrRestoreDashboardAction,
}) => {
  const { pending = [], completed = [] } = dashboardActions || {};
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState('all');
  const [selectedProjectsPending, setSelectedProjectsPending] = useState(
    new Set(),
  );
  const [selectedTradesPending, setSelectedTradesPending] = useState(new Set());
  const [selectedDescNamesPending, setSelectedDescNamesPending] = useState(
    new Set(),
  );
  const [selectedProjectsCompleted, setSelectedProjectsCompleted] = useState(
    new Set(),
  );
  const [selectedTradesCompleted, setSelectedTradesCompleted] = useState(
    new Set(),
  );
  const [selectedDescNamesCompleted, setSelectedDescNamesCompleted] = useState(
    new Set(),
  );

  const handleTabChange = (_event, newValue) => {
    setTab(newValue);
  };

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setFilter(value);
    fetchDashboardActions(value);
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Typography fontSize={32} fontWeight={600} sx={{ mb: 1 }}>
        Dashboard
      </Typography>

      <Box
        sx={{
          width: '100%',
          p: 0,
          backgroundColor: white,
          borderRadius: 3,
          border: `1px solid ${clinkLightPurple}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${clinkLightPurple}`,
            pr: 2,
          }}
        >
          <Tabs
            value={tab}
            onChange={handleTabChange}
            aria-label="Dashboard Tabs"
          >
            <Tab label="Actions Required" />
            <Tab label="Actions Completed" />
          </Tabs>

          <FormControl size="small" sx={{ width: 180 }}>
            <Select value={filter} onChange={handleFilterChange} displayEmpty>
              <MenuItem value={'all'}>{i18next.t('all')}</MenuItem>
              <MenuItem value={'this_week'}>{i18next.t('this-week')}</MenuItem>
              <MenuItem value={'previous_week'}>
                {i18next.t('last-week')}
              </MenuItem>
              <MenuItem value={'older'}>{i18next.t('older')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <ActionsTable
              items={pending}
              clinkAccount={clinkAccount}
              type="pending"
              filter={filter}
              dispatchRemoveOrRestoreDashboardAction={
                dispatchRemoveOrRestoreDashboardAction
              }
              fetchDashboardActions={fetchDashboardActions}
              selectedProjects={selectedProjectsPending}
              setSelectedProjects={setSelectedProjectsPending}
              selectedTrades={selectedTradesPending}
              setSelectedTrades={setSelectedTradesPending}
              selectedDescNames={selectedDescNamesPending}
              setSelectedDescNames={setSelectedDescNamesPending}
            />
          )}
          {tab === 1 && (
            <ActionsTable
              items={completed}
              clinkAccount={clinkAccount}
              type="completed"
              filter={filter}
              dispatchRemoveOrRestoreDashboardAction={
                dispatchRemoveOrRestoreDashboardAction
              }
              fetchDashboardActions={fetchDashboardActions}
              selectedProjects={selectedProjectsCompleted}
              setSelectedProjects={setSelectedProjectsCompleted}
              selectedTrades={selectedTradesCompleted}
              setSelectedTrades={setSelectedTradesCompleted}
              selectedDescNames={selectedDescNamesCompleted}
              setSelectedDescNames={setSelectedDescNamesCompleted}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardTabs;
