import React from 'react';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import { CONSTANTS } from 'clink-components';
import Typography from '@mui/material/Typography';
import { getDateValuesV1 } from 'v2/helpers/date';
import ClinkForm from '../../../../../global/components/clink-form';
import TenderBuilderService from '../../../../../global/services/plan-my-project/tender-builder';
import { callback, validateSchema, formFields } from './Assets';

const { proxima } = CONSTANTS.fonts;
const { clinkBlack } = CONSTANTS.colors.general;

// TODO: To review all typography styles and move them to global theme
const sx = {
  marginBottom: '1px',
  form: {
    width: '100%',
    svg: {
      '&.calendar, &.angle-down': {
        top: '12px',
      },
      '&.calendar': {
        left: '6px',
      },
    },
    '&:first-of-type': {
      marginRight: '21px',
    },
    '.react-datepicker-popper': {
      zIndex: 111,
      '.navigation--current-month': {
        lineHeight: 4,
      },
    },
    '.clink-form__label-error.form-label': {
      display: 'flex',
      marginBottom: 0,
      justifyContent: 'space-between',
      '.invalid-feedback': {
        fontSize: '14px',
        marginTop: 0,
      },
    },
    '.date-input.form-control': {
      fontSize: '14px !important',
      paddingLeft: '25px !important',
    },
  },
};
const fontSx = {
  fontSize: '14px !important',
  color: clinkBlack,
  fontFamily: `${proxima} !important`,
};
const fontWithWeightSx = {
  ...fontSx,
  fontWeight: `700 !important`,
};

const DateManagement = ({ pid, pack = {} }) => {
  const tenderBuilderService = new TenderBuilderService(pid);
  const [tenderReturnDate, tenderStartDate] = formFields;

  return (
    <Grid
      container
      sx={sx}
      justifyContent="space-around"
      component={Paper}
      spacing={2}
    >
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <ClinkForm
          initialValues={{
            tenderReturnDate: getDateValuesV1(pack.tender_return),
          }}
          formFields={[
            {
              ...tenderReturnDate,
              callback: (dateObject) =>
                callback(dateObject, tenderBuilderService, pack),
            },
          ]}
          initialTouched={{ tenderReturnDate: true }}
          validationSchema={validateSchema('tenderReturnDate')}
          SubmitButton={() => null}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <ClinkForm
          initialValues={{
            tenderStartDate: getDateValuesV1(pack.start_on_site),
          }}
          formFields={[
            {
              ...tenderStartDate,
              callback: (dateObject) =>
                callback(dateObject, tenderBuilderService, pack),
            },
          ]}
          initialTouched={{ tenderStartDate: true }}
          validationSchema={validateSchema('tenderStartDate')}
          SubmitButton={() => null}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Typography sx={fontWithWeightSx}>Service</Typography>
        <Typography sx={fontSx}>{pack.service_label || ''}</Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Typography sx={fontWithWeightSx}>Size</Typography>
        <Typography sx={fontSx}>{pack.size_label || ''}</Typography>
      </Grid>
    </Grid>
  );
};

export default DateManagement;
