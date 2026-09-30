import React, { useMemo } from 'react';
import { useContext } from 'hooks/context';
import { connect } from 'react-redux';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import dayjs from 'dayjs';
import { TA_LABEL } from 'v1/global/helpers/constants';

const SelectTender = ({
  templates = [],
  selectedTemplate = 0,
  did = 0,
  open,
  dispatch,
}) => {
  const context = useContext('clink');
  const { actions } = context;

  const filteredDocs = useMemo(
    () =>
      templates.filter((d) =>
        open && open?.tenderAddendum
          ? d.name === TA_LABEL
          : d.name !== TA_LABEL,
      ),
    [templates, open],
  );

  const handleChange = (e) =>
    dispatch(actions.setSelectedTemplate(e.target.value));

  return (
    <FormControl fullWidth>
      <Select
        value={selectedTemplate || did}
        onChange={handleChange}
        required
        disabled={!templates.length}
      >
        {filteredDocs.map((template) => {
          const label = template.created_at?.length
            ? `${template.tender} - ${template.name} - ${dayjs(template.created_at).format('DD/MM/YYYY')}`
            : `${template.tender} - ${template.name}`;

          return (
            <MenuItem
              sx={{ whiteSpace: 'break-spaces' }}
              key={template.id}
              value={template.id}
            >
              {label}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

const mapStateToProps = (state) => ({
  loading: state.contacts.loading,
  open: state.contacts.open,
  templates: state?.tenderTemplates?.tenderTemplates,
  selectedTemplate: state.contacts.selectedTemplate,
  slug: state.project.data.slug,
});

export default connect(mapStateToProps)(SelectTender);
