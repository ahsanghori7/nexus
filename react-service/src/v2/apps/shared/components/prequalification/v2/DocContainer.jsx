import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {
  MuiSubtitle,
  MuiSubmitWrapper,
} from 'v2/apps/shared/components/company-v2/Mui.styled';
import MuiDialog from 'v2/apps/shared/components/dialog';
import CommonForm from './documents_v2/Form';

const DocContainer = ({
  aid,
  type,
  title = '',
  selected = null,
  fileError = null,
  description = '',
  actionLabel = '',
  titleDialog = '',
  sectionData = [],
  action = () => null,
  handleOnClose = () => null,
  handleSubmit = () => null,
  selectedOptions = [],
  options = [],
  open = false,
  Form = CommonForm,
  Inputs = null,
  showOtherOptionForAll = false,
  children,
}) => (
  <Box>
    <Box sx={{ width: '100%', height: '100%', mt: 4 }}>
      {Boolean(title && title.length) && <MuiSubtitle>{title}</MuiSubtitle>}
      <Typography sx={{ fontSize: '14px', fontWeight: '100', mb: 3 }}>
        {description}
      </Typography>
    </Box>
    <Box>{children}</Box>
    <Box sx={{ width: '100%', height: '100%' }}>
      <MuiSubmitWrapper capitalize={false}>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          fullWidth
          onClick={action}
        >
          {actionLabel}
        </Button>
      </MuiSubmitWrapper>
    </Box>
    <MuiDialog
      title={titleDialog}
      open={open}
      handleClose={handleOnClose}
      dialogWidth={448}
    >
      {Boolean(Form) && (
        <Form
          aid={aid}
          type={type}
          data={selected}
          fileError={fileError}
          options={options}
          sectionData={sectionData}
          selectedOptions={selectedOptions}
          handleOnSubmit={handleSubmit}
          showOtherOptionForAll={showOtherOptionForAll}
          Inputs={Boolean(Inputs) && Inputs}
        />
      )}
    </MuiDialog>
  </Box>
);

export default DocContainer;
