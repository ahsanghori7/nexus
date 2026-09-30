import React from 'react';
import Inputs from '../../../global/components/clink-form/inputs';
import PackageCollator from '../../../global/components/plan-my-project/package-collator';
import Loading from '../../../global/components/Loading';
import StyledWrapper from './Wrapper.styled';

const ContentLeft = ({
  formFields,
  values,
  setFieldValue,
  validationSchema,
  fetch = null,
  removeFile = null,
  callback = null,
}) => (
  <Inputs
    formFields={formFields}
    values={values}
    setFieldValue={setFieldValue}
    validationFieldSchema={validationSchema}
    fetch={fetch}
    removeFile={removeFile}
    callback={callback}
  />
);

const PackageCollatorPage = (props) => {
  const {
    title,
    formFields,
    values,
    setFieldValue,
    validationFieldSchema,
    fetch,
    removeFile,
    submittingFiles,
    callback,
  } = props;

  const contentLeft = (
    <StyledWrapper>
      {submittingFiles && <Loading fullDiv />}
      <ContentLeft
        formFields={formFields}
        values={values}
        setFieldValue={setFieldValue}
        validationSchema={validationFieldSchema}
        fetch={fetch}
        removeFile={removeFile}
        callback={callback}
      />
    </StyledWrapper>
  );

  return (
    <div className="edit-project">
      <PackageCollator title={title} contentLeft={contentLeft} />
    </div>
  );
};

export default PackageCollatorPage;
