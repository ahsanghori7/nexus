import React from 'react';
import { CONSTANTS } from 'clink-components';
import LazyImage from '../../../components/LazyImage';
import ClinkForm from '../../../components/clink-form';

const { iconTrashBlack } = CONSTANTS.s3;
const Form = ({
  service,
  dependencies = [],
  setDependencies = () => null,
  index,
}) => {
  const { initialValues, formFields, validationSchema } = service;
  return (
    <ClinkForm
      initialValues={initialValues}
      formFields={formFields}
      validationSchema={validationSchema}
      triggerCustomErrors={false}
      SubmitButton={() => null}
      // eslint-disable-next-line react/no-unstable-nested-components
      AuxButton={() =>
        index ? (
          <div className="delete-button">
            <button
              className="clink-button"
              onClick={() => {
                const auxDep = [...dependencies];
                auxDep.splice(index, 1);
                setDependencies(auxDep);
              }}
            >
              <LazyImage src={iconTrashBlack} />
            </button>
          </div>
        ) : null
      }
    />
  );
};

export default Form;
