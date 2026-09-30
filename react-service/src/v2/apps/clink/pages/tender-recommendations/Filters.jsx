import React from 'react';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import i18next from 'v2/helpers/i18n';

const OPTIONS = [
  { value: 'all', label: i18next.t('all') },
  { value: 'drafts', label: i18next.t('drafts-only') },
  { value: 'pending', label: i18next.t('pending-only') },
  { value: 'approved', label: i18next.t('approved-only') },
  { value: 'rejected', label: i18next.t('rejected-only') },
];

const Filters = ({ value = 'all', onChange }) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <FormControl data-testid="tr-filters" size="small" sx={{ width: 220 }}>
      <Select data-testid="tr-filter-select" value={value} onChange={handleChange} displayEmpty>
        {OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default Filters;
