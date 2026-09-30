/* eslint-disable jsx-a11y/no-autofocus */
import React, { useEffect } from 'react';
import i18next from 'v2/helpers/i18n';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import 'v1/global';
import 'v1/document-creator/public/styles/index.scss';
import Skeleton from '@mui/material/Skeleton';
import { Form } from 'formik';
import ClinkForm from 'v1/global/components/clink-form';
import FieldRenderer from 'v1/global/components/clink-form/inputs/FieldRenderer';
import Title from 'v1/document-creator/components/template/docusign/Title';
import useValidation from 'v1/document-creator/components/template/form-config/useValidation';
import VirtualizedInputs from './VirtualizedInputs';

const TitleConfig = {
  tender: 'edit-tender-template',
  order: 'edit-order',
};

const FormConfig = (props) => {
  const {
    docType,
    service,
    showForm,
    loadingConfig,
    loadingConfigService,
    updateTemplateServiceFirst,
    updateTemplateServiceSecond,
    applyObserverActions,
    formRef,
    formErrors,
    signature,
    formValues,
    numberDocuments,
    missingHighlight = false,
    missingInputRefFocused = null,
    formViewerRef,
    virtualizedInputsRef,
    fileManagerButton = () => null,
  } = props;
  const { formFields: fields, signatureFields } = service;
  const validationSchema = useValidation(fields);
  useEffect(() => {
    if (showForm && !loadingConfig) {
      updateTemplateServiceFirst().then(updateTemplateServiceSecond);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, loadingConfig]);

  let fieldsFiltered = [...fields];
  if (signature === 'wet') {
    fieldsFiltered = fieldsFiltered.filter((f) => {
      const references = f.dataref ?? [];
      return !references.includes('docusign');
    });
  }
  if (missingHighlight) {
    fieldsFiltered = fieldsFiltered.map((f) => {
      let highlight = !Boolean(formValues[f.name]);
      if (f.type === 'editor') {
        highlight =
          (isString(formValues[f.name]) && !Boolean(formValues[f.name])) ||
          (isObject(formValues[f.name]) &&
            !Boolean(formValues[f.name].editorHtml));
      }
      const missingRef =
        missingInputRefFocused && missingInputRefFocused[f.name];
      return {
        ...f,
        highlight,
        missingRef,
      };
    });
  }
  const hiddenFields = fieldsFiltered.filter((field) => field.type === 'hidden');
  const visibleFields = fieldsFiltered
    .filter((field) => {
      if (field.type === 'hidden') return false;
      if (!field.labelFrom) return true;
      const parent = formValues[field.labelFrom];
      return Boolean(parent && (parent.label || parent !== ''));
    })
    .map((field) => {
      const option = formValues[field.labelFrom]?.label;
      const nextField =
        field.labels && option
          ? { ...field, label: field.labels[option] || field.label }
          : field;
      const orderValueInfo = fieldsFiltered.find(
        (f) => f.name === 'DomesticOrderValueTooltip',
      )?.info;
      return field.name === 'OrderPrice' && orderValueInfo
        ? {
            ...nextField,
            disabled: true,
            info: orderValueInfo,
          }
        : nextField;
    });

  const optionIsDisable = (selectOptions, name) => {
    let newOptions = [...selectOptions];
    if (signatureFields[name]) {
      signatureFields[name].forEach((k) => {
        const selectFormValue = formValues[k];
        if (selectFormValue && selectFormValue.id) {
          newOptions = newOptions.map((o) => {
            if (
              o &&
              o.id &&
              o.id !== -1 &&
              String(selectFormValue.id) === String(o.id) &&
              k !== name
            ) {
              return {
                ...o,
                isDisabled: true,
              };
            }
            return o;
          });
        }
      });
    }
    return newOptions;
  };
  let panelLeft = showForm ? (
    <Skeleton width={400} height={1000} />
  ) : (
    <div className="min-height-600" />
  );

  if (!loadingConfig && !loadingConfigService) {
    panelLeft = showForm ? (
      <div className="pdf-edit-form-layout">
        <Title
          text={i18next.t(TitleConfig[docType])}
          testId={`${TitleConfig[docType]}-title`}
        />
        <ClinkForm
          enableReinitialize
          initialValues={formValues}
          formFields={fieldsFiltered}
          validationSchema={validationSchema}
          render={({ values, setFieldValue, errors }) => {
            const errorsToSend = { ...errors, ...formErrors };
            let valuesForm = values;
            if (numberDocuments?.length) {
              valuesForm = { ...values };
              numberDocuments.forEach((nd) => {
                const { meta: metaJson } = nd;
                const meta = JSON.parse(metaJson);
                const { number_document } = meta;
                if (valuesForm[number_document]) {
                  valuesForm[number_document] = nd;
                }
              });
            }
            return (
              <Form className="clink-form pdf-edit-form" ref={formRef}>
                <input type="hidden" autoFocus />
                {hiddenFields.map((field) => (
                  <FieldRenderer
                    key={field.key || field.name}
                    customErrors={errorsToSend}
                    errors={errorsToSend}
                    field={field}
                    fileManagerButton={fileManagerButton}
                    optionIsDisable={optionIsDisable}
                    setFieldValue={(name, value) => {
                      setFieldValue(name, value);
                      applyObserverActions(
                        name,
                        value,
                        formValues,
                        (inputObserver, newValue) => {
                          setFieldValue(inputObserver, newValue);
                          service.saveData(inputObserver, newValue);
                        },
                      );
                    }}
                    triggerCustomErrors
                    validationFieldSchema={validationSchema}
                    values={valuesForm}
                  />
                ))}
                <VirtualizedInputs
                  ref={virtualizedInputsRef}
                  customErrors={errorsToSend}
                  errors={errorsToSend}
                  fileManagerButton={fileManagerButton}
                  formFields={visibleFields}
                  formViewerRef={formViewerRef}
                  menuPortalTarget={
                    typeof document === 'undefined' ? null : document.body
                  }
                  portalId="date-picker-portal"
                  optionIsDisable={optionIsDisable}
                  setFieldValue={(name, value) => {
                    setFieldValue(name, value);
                    applyObserverActions(
                      name,
                      value,
                      formValues,
                      (inputObserver, newValue) => {
                        setFieldValue(inputObserver, newValue);
                        service.saveData(inputObserver, newValue);
                      },
                    );
                  }}
                  triggerCustomErrors
                  validationFieldSchema={validationSchema}
                  values={valuesForm}
                />
                {(!visibleFields || visibleFields.length < 1) && (
                  <div className="min-height-600" />
                )}
              </Form>
            );
          }}
        />
      </div>
    ) : (
      <div className="min-height-600" />
    );
  }

  return panelLeft;
};

export default FormConfig;
