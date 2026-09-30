import React from 'react';
import Button from '@mui/material/Button';
import chunk from 'lodash/chunk';
import Container from '@mui/material/Container';
import { CONSTANTS } from 'clink-components';
import { Form } from 'formik';
import BForm from 'react-bootstrap/Form';
import Inputs from '../../clink-form/inputs';
import LoadingContent from './LoadingContent';
import Loading from '../../Loading';
import FieldHolder from '../../clink-form/FieldHolder';
import GreenButton from '../../general-ui/Buttons';

const { ghostWhite } = CONSTANTS.colors.general;
const BATCH_NUMBER = 3;

/* eslint react/no-array-index-key: "off" */
const Content = ({
  formFields,
  values,
  errors,
  setFieldValue,
  page,
  loading,
  isCustom,
  navButton = null,
  isEdit = false,
  service = {},
  init = () => null,
  validateForm = () => null,
  setFieldTouched = () => null,
}) => {
  let label = null;
  let description = null;
  let className = 'description-label';
  let htmlFor = '';
  const [groupZero, groupOne] = formFields;

  const newGroupOne = groupOne.map((field) => {
    const newField = { ...field };
    if (newField.name === 'packageName') {
      label = field.label(isCustom);
      description = field.description(isCustom);
      className = `${className} ${newField.className}`;
      htmlFor = newField.name;
      delete newField.label;
      delete newField.description;
      delete newField.required;
    }
    return newField;
  });
  const newFormFields = [groupZero, newGroupOne];
  const classSubmitButton = label && description && 'submit-package';
  const labelCustomButton = isCustom ? 'CREATE PACKAGE' : 'ADD PACKAGE';
  const labelButton = page ? labelCustomButton : 'ADD';
  const sxNavButton =
    isEdit && !page
      ? { '& > #nav-button-main': { justifyContent: 'space-between' } }
      : {};

  const [tenderBuilder] = groupZero;
  const { options } = tenderBuilder;
  const checkDeletes = options
    .map((option) => {
      const check = service.checkDelete(option.id);
      if (check && !check[0]) {
        return option;
      }
      return null;
    })
    .filter((option) => option);

  const chunkOfIds = chunk(checkDeletes, BATCH_NUMBER);
  const bulkDelete = () => {
    const recursiveCall = async (currentChunk) => {
      if (currentChunk && currentChunk.length) {
        const [first, ...rest] = currentChunk;
        // eslint-disable-next-line no-console
        const promises = first.map((opt) => service.deleteTender(opt.id));
        return Promise.all(promises).then(async (result) => [
          ...result,
          ...(await recursiveCall(rest)),
        ]);
      }
      return [];
    };
    return recursiveCall(chunkOfIds);
  };
  const handleReset = () => {
    if (chunkOfIds.length) {
      return bulkDelete().finally(init);
    }
    if (!checkDeletes.length && options.length) {
      const optionsError = {
        title: 'Cannot Remove Trades',
        message:
          'The trades cannot be removed because they are currently assigned to packages.',
        type: 'error',
      };
      return service.alert({}, null, {}, optionsError);
    }
    return null;
  };

  return (
    <>
      <Button
        sx={{ marginLeft: '15px', marginBottom: '15px' }}
        onClick={handleReset}
        variant="text"
        data-testid="work-packages-clear-all-button"
      >
        Clear all
      </Button>
      <Form className="clink-form tender-builder-form">
        {newFormFields.map((fields, index) => (
          <div className={`group-${index}`} key={`group-${index}`}>
            {Boolean(index) && label && description && (
              <FieldHolder className={className}>
                <BForm.Label htmlFor={htmlFor}>
                  {label}&nbsp;
                  <div className="required">*</div>
                </BForm.Label>
                {description}
              </FieldHolder>
            )}
            <Inputs
              formFields={fields}
              values={values}
              errors={errors}
              setFieldValue={setFieldValue}
            />
            {formFields.length === index + 1 && (
              <FieldHolder
                id="tender-builder-add-package"
                style={{ marginBottom: 0 }}
                className={`submit-button-holder ${classSubmitButton}`}
              >
                <GreenButton
                  type="button"
                  label={labelButton}
                  plusIcon={false}
                  data-testid="work-packages-add-button"
                  onClick={async () => {
                    const actionsByPage = {
                      0: service.submitMissingTrade,
                      1: service.submitCreatePackage,
                    };

                    const action = actionsByPage[page];
                    if (!action) return;

                    // Validate form before proceeding
                    if (validateForm && typeof validateForm === 'function') {
                      const validationErrors = await validateForm();

                      // Check if there are validation errors
                      if (validationErrors && Object.keys(validationErrors).length > 0) {
                        // Mark all fields as touched to show errors
                        Object.keys(validationErrors).forEach((fieldName) => {
                          if (setFieldTouched && typeof setFieldTouched === 'function') {
                            setFieldTouched(fieldName, true, false);
                          }
                        });
                        return;
                      }
                    }

                    action(values)
                      .then(() => init())
                      .catch(() => null);
                  }}
                />
              </FieldHolder>
            )}
          </div>
        ))}
        {loading && <Loading fullDiv />}
      </Form>
      <Container
        sx={{
          padding: '0 !important',
          backgroundColor: ghostWhite,
          maxWidth: 'none !important',
        }}
        id="nav-buttons-1"
      >
        <Container
          sx={{ padding: '0 22px !important', ...sxNavButton }}
          id="nav-buttons-2"
        >
          {navButton}
        </Container>
      </Container>
    </>
  );
};

const ContentLeft = (props) => {
  const {
    loading,
    firstLoad,
    showMessage,
    closeAlertMessage,
    formFields,
    errors,
    values,
    setFieldValue,
    formFieldsGroups,
    page,
    isCustom,
    navButton = null,
    isEdit = false,
    service = {},
    init = () => null,
    validateForm = () => null,
    setFieldTouched = () => null,
  } = props;
  return loading && firstLoad ? (
    <LoadingContent />
  ) : (
    <Content
      showMessage={showMessage}
      closeAlertMessage={closeAlertMessage}
      formFields={formFields}
      values={values}
      errors={errors}
      setFieldValue={setFieldValue}
      formFieldsGroups={formFieldsGroups}
      page={page}
      loading={loading}
      isCustom={isCustom}
      navButton={navButton}
      isEdit={isEdit}
      service={service}
      init={init}
      validateForm={validateForm}
      setFieldTouched={setFieldTouched}
    />
  );
};

export default ContentLeft;
