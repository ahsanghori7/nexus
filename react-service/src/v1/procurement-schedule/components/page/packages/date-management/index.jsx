import React from 'react';
import { getDateValuesV1 } from 'v2/helpers/date';
import ClinkForm from '../../../../../global/components/clink-form';
import TenderBuilderService from '../../../../../global/services/plan-my-project/tender-builder';
import { callback, validateSchema, formFields, Wrapper } from './Assets';

const DateManagement = ({ pid, pack }) => {
  const tenderBuilderService = new TenderBuilderService(pid);
  const [tenderReturnDate, tenderStartDate] = formFields;

  return (
    <Wrapper>
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
    </Wrapper>
  );
};

export default DateManagement;
