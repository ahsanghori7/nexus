import React, { useState, useMemo, useEffect } from 'react';
import { TextField, Typography, MenuItem } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import disabledTextFieldSx from './disabledSx';

const SubcontractorDetails = ({
  dataById,
  project,
  tenderRecommendationById,
  dispatch,
  contextType = 'clink',
  approvalRequestSent,
}) => {
  const context = useContext(contextType);
  const { actions } = context;
  const [selectedContact, setSelectedContact] = useState('');
  const [contactDetails, setContactDetails] = useState({
    jobTitle: '',
    phone: '',
    email: '',
  });

  const contactOptions = useMemo(() => {
    if (!dataById?.collection?.users) return [];

    const users = dataById?.collection?.users?.filter(
      (user) => String(user.status) === '2',
    );
    return users.map((user) => ({
      value: user.id,
      label: user.display_name,
      jobTitle: user.job_title || '',
      phone: user.contact_number || '',
      email: user.email || '',
    }));
  }, [dataById]);

  useEffect(() => {
    const subcontractorUserId = tenderRecommendationById?.subcontractor_user_id;

    if (subcontractorUserId && contactOptions.length > 0) {
      const userIdString = String(subcontractorUserId);
      setSelectedContact(userIdString);

      const selectedUser = contactOptions.find(
        (option) => String(option.value) === userIdString,
      );

      if (selectedUser) {
        setContactDetails({
          jobTitle: selectedUser.jobTitle,
          phone: selectedUser.phone,
          email: selectedUser.email,
        });
      }
    }
  }, [tenderRecommendationById?.subcontractor_user_id, contactOptions]);

  const handleContactChange = (event) => {
    const selectedValue = event.target.value;
    const project_id = project?.data?.id;
    const tid = tenderRecommendationById?.tender_recommendation_id;
    setSelectedContact(selectedValue);

    const selectedUser = contactOptions.find(
      (option) => option.value === selectedValue,
    );

    if (selectedUser) {
      setContactDetails({
        jobTitle: selectedUser.jobTitle,
        phone: selectedUser.phone,
        email: selectedUser.email,
      });

      if (project_id && tid) {
        dispatch(
          actions.updateTenderRecommendationById({
            project_id,
            tid,
            data: {
              subcontractor_user_id: selectedUser.value,
            },
          }),
        );
      }
    } else {
      setContactDetails({
        jobTitle: '',
        phone: '',
        email: '',
      });
    }
  };
  return (
    <Grid2 container spacing={0} sx={{ flexDirection: 'column', px: 3, pb: 3 }}>
      <Grid2>
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, sm: 12, md: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('subcontractor-name')}
            </Typography>
            <TextField
              fullWidth
              placeholder={i18next.t('subcontractor-name-placeholder')}
              disabled
              variant="outlined"
              size="small"
              sx={disabledTextFieldSx}
              value={dataById?.collection?.name || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 12, md: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('company-registration-number')}
            </Typography>
            <TextField
              fullWidth
              placeholder={i18next.t('company-registration-placeholder')}
              disabled
              variant="outlined"
              size="small"
              sx={disabledTextFieldSx}
              value={dataById?.collection?.reg_number || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 12, md: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('business-address')}
            </Typography>
            <TextField
              fullWidth
              placeholder={i18next.t('business-address-placeholder')}
              disabled
              size="small"
              variant="outlined"
              sx={disabledTextFieldSx}
              value={dataById?.collection?.address || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('contact-name')}
            </Typography>
            <FormControl fullWidth>
              <Select
                data-testid="tr-contact-name-select"
                value={selectedContact}
                onChange={handleContactChange}
                displayEmpty
                size="small"
                variant="outlined"
                sx={disabledTextFieldSx}
                disabled={
                  approvalRequestSent ||
                  tenderRecommendationById?.status === 'Pending'
                }
              >
                <MenuItem value="">{i18next.t('select-contact')}</MenuItem>
                {contactOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('job-title')}
            </Typography>
            <TextField
              fullWidth
              disabled
              size="small"
              variant="outlined"
              sx={disabledTextFieldSx}
              value={contactDetails.jobTitle}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('phone')}
            </Typography>
            <TextField
              fullWidth
              type="tel"
              placeholder={i18next.t('enter-phone-number')}
              disabled
              variant="outlined"
              size="small"
              sx={disabledTextFieldSx}
              value={contactDetails.phone}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('email')}
            </Typography>
            <TextField
              fullWidth
              type="email"
              placeholder={i18next.t('enter-email-address')}
              disabled
              variant="outlined"
              size="small"
              sx={disabledTextFieldSx}
              value={contactDetails.email}
            />
          </Grid2>
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

const mapStateToProps = (state) => {
  return {
    dataById: state.supplyChain.dataById,
    project: state.project,
    tenderRecommendationById:
      state.tenderRecommendation.tenderRecommendationById,
  };
};

export default connect(mapStateToProps)(SubcontractorDetails);
