import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import Search from '@mui/icons-material/Search';

const ProcurementScheduleFilters = ({
  searchTerm,
  setSearchTerm,
  milestoneStatus,
  setMilestoneStatus,
  tenderStatus,
  setTenderStatus,
  variance,
  setVariance,
  packagesAtRisk,
  setPackagesAtRisk,
}) => {
  // Manually manage visual focus state per select to fix double-click blur issue
  const [focusedSelect, setFocusedSelect] = useState({
    milestone: false,
    tender: false,
    variance: false,
    risk: false,
  });

  const handleOpen = (key) => {
    setFocusedSelect((prev) => ({ ...prev, [key]: true }));
  };

  const handleClose = (key) => {
    setFocusedSelect((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <>
      <TextField
        size="small"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        inputProps={{ 'data-testid': 'filter-search' }}
        sx={{
          width: 200,
          '& .MuiInputBase-input': {
            paddingLeft: '0 !important',
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ pl: 1 }}>
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <FormControl
        size="small"
        sx={{ width: 200 }}
        focused={focusedSelect.milestone}
      >
        <InputLabel sx={{ top: 0 }}>Milestone Status</InputLabel>
        <Select
          value={milestoneStatus}
          label="Milestone Status"
          onChange={(e) => setMilestoneStatus(e.target.value)}
          onOpen={() => handleOpen('milestone')}
          onClose={() => handleClose('milestone')}
          inputProps={{ 'data-testid': 'filter-milestone-status' }}
        >
          <MenuItem value="All">
            <em>All</em>
          </MenuItem>
          <MenuItem value="Not Started">Not Started</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{ width: 200 }}
        focused={focusedSelect.tender}
      >
        <InputLabel sx={{ top: 0 }}>Tender Status</InputLabel>
        <Select
          value={tenderStatus}
          label="Tender Status"
          onChange={(e) => setTenderStatus(e.target.value)}
          onOpen={() => handleOpen('tender')}
          onClose={() => handleClose('tender')}
          inputProps={{ 'data-testid': 'filter-tender-status' }}
        >
          <MenuItem value="All">
            <em>All</em>
          </MenuItem>
          <MenuItem value="tbc">TBC</MenuItem>
          <MenuItem value="name">Named</MenuItem>
          <MenuItem value="shortlisted">Shortlisted</MenuItem>
          <MenuItem value="awarded">Awarded</MenuItem>
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{ width: 200 }}
        focused={focusedSelect.variance}
      >
        <InputLabel sx={{ top: 0 }}>Variance</InputLabel>
        <Select
          value={variance}
          label="Variance"
          onChange={(e) => setVariance(e.target.value)}
          onOpen={() => handleOpen('variance')}
          onClose={() => handleClose('variance')}
          inputProps={{ 'data-testid': 'filter-variance' }}
        >
          <MenuItem value="All">
            <em>All</em>
          </MenuItem>
          <MenuItem value="positive">Positive Variance</MenuItem>
          <MenuItem value="negative">Negative Variance</MenuItem>
          <MenuItem value="zero">Zero Variance</MenuItem>
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{ width: 200 }}
        focused={focusedSelect.risk}
      >
        <InputLabel sx={{ top: 0 }}>Packages at Risk</InputLabel>
        <Select
          value={packagesAtRisk}
          label="Packages at Risk"
          onChange={(e) => setPackagesAtRisk(e.target.value)}
          onOpen={() => handleOpen('risk')}
          onClose={() => handleClose('risk')}
          inputProps={{ 'data-testid': 'filter-packages-at-risk' }}
        >
          <MenuItem value="All">
            <em>All</em>
          </MenuItem>
          <MenuItem value="Approaching">Approaching</MenuItem>
          <MenuItem value="Overdue">Overdue</MenuItem>
        </Select>
      </FormControl>
    </>
  );
};

export default ProcurementScheduleFilters;
