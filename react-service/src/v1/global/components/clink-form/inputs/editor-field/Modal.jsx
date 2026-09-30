import React, { useState, useRef } from 'react';
import { CONSTANTS } from 'clink-components';
import BModal from 'react-bootstrap/Modal';
import FormLabel from 'react-bootstrap/FormLabel';
import Config from 'v1/document-creator/helpers/config';
import GreenButton, { CloseButton } from '../../../general-ui/Buttons';
import EditorInput from './EditorInput';
import FieldHolder from '../../FieldHolder';
import Select from '../select-field';
import Relay from '../../../../services/Relay';
import { getTextFromJson, getTextFromHTML } from '../../../../helpers/data';
import FieldError from '../../FieldError';

const { heatWave } = CONSTANTS.colors.general;

const ModalEditor = (props) => {
  // Use a ref to access the quill instance directly
  const quillRef = useRef();
  const {
    name,
    title = 'Edit Text',
    subtitle = '',
    className = '',
    label = null,
    placeholder = '',
    required = false,
    docCreator = false,
    value,
    children,
    handleClick = () => {},
    handleBlur = () => {},
    handleChangeOptions = () => {},
    sourceOptions,
    setFieldValue,
    error,
    triggerCustomErrors,
    highlight = false,
    missingRef = null,
    noOptionsMessage,
  } = props;
  const highlightProp = highlight
    ? {
        style: {
          border: `1px solid ${heatWave}`,
        },
      }
    : {};

  const newValue = (value && value.editorHtml) || '';
  let newPlaceholder = getTextFromHTML(
    (newValue || placeholder).replaceAll('><', '> <'),
  );
  newPlaceholder = getTextFromJson(newPlaceholder);

  const panelLabel = sourceOptions?.panelLabel || 'Custom description';
  const clearLabel = sourceOptions?.clearLabel || 'Clear template';
  const hasEditorContent =
    Boolean(newPlaceholder) &&
    newPlaceholder !== 'Click to open' &&
    newPlaceholder !== placeholder;
  let displayValue = newPlaceholder || placeholder;
  if (value?.templateName) {
    displayValue = value.templateName;
  } else if (hasEditorContent && sourceOptions) {
    displayValue = panelLabel;
  }

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState();

  const handleOnClick = () => {
    setShowModal(true);
    handleClick();

    if (sourceOptions) {
      const { action, method, args } = sourceOptions;
      const relay = new Relay(action, method);
      relay.getJson(args).then((result) => {
        const templateOptions = result
          ? result
              .map((option) => ({
                id: option.id,
                value: option.id,
                label: option.name,
              }))
              .sort((optionA, optionB) =>
                optionA.label
                  .toLowerCase()
                  .localeCompare(optionB.label.toLowerCase()),
              )
          : [];
        setOptions(templateOptions);
        if (value?.templateId) {
          const matchedTemplate = templateOptions.find(
            (option) => Number(option.id) === Number(value.templateId),
          );
          if (matchedTemplate) {
            setSelectedTemplate(matchedTemplate);
          }
        }
      });
    }
  };

  const handleOnChangeOptions = (_optionName, optionValue) => {
    setLoading(true);
    setSelectedTemplate(optionValue);
    handleChangeOptions(name, optionValue, setFieldValue).then(() =>
      setLoading(false),
    );
  };

  const close = () => {
    setShowModal(false);
  };

  const onModalSubmit = () => {
    const val = quillRef?.current?.getSemanticHTML() || value?.editorHtml || '';
    const meta = sourceOptions
      ? {
          templateName: value?.templateName || '',
          templateId: value?.templateId || null,
        }
      : {};
    handleBlur(Config.cleanHtml(val), null, null, meta);
    close();
  };

  const onClearTemplate = () => {
    if (!sourceOptions || loading) return;
    setLoading(true);
    setSelectedTemplate(null);
    const clearedValue = {
      editorHtml: '',
      files: [],
      templateName: '',
      templateId: null,
    };
    setFieldValue(name, clearedValue);
    Promise.resolve(
      handleBlur('', null, null, { templateName: '', templateId: null }),
    ).finally(() => setLoading(false));
  };

  return (
    <>
      <FieldHolder
        className={className}
        ref={(el) => {
          if (missingRef) {
            missingRef.input = el;
          }
          return true;
        }}
      >
        <FormLabel htmlFor={name}>
          {children} {label} {required && <div className="required">*</div>}
        </FormLabel>
        <input
          type="text"
          name={name}
          onClick={handleOnClick}
          value={displayValue}
          className="form-control input-in-modal"
          {...highlightProp}
          readOnly
        />
        <span />
        {error && (
          <FieldError
            triggerCustomErrors={triggerCustomErrors}
            name={name}
            customErrors={{ [name]: error }}
          />
        )}
      </FieldHolder>
      <BModal
        show={showModal}
        onHide={close}
        className="modal-editor-component document-creator-modal__edit-content"
      >
        <BModal.Header>
          <BModal.Title id="custom-modal">
            <div className="modal-title h4" id="custom-modal">
              {title}
            </div>
          </BModal.Title>
        </BModal.Header>
        <BModal.Body>
          {subtitle && (
            <p className="modal-editor-subtitle text-muted mb-3">{subtitle}</p>
          )}
          {sourceOptions && (
            <>
              <Select
                label={sourceOptions?.label ?? ''}
                name={sourceOptions?.name ?? ''}
                placeholder={sourceOptions?.placeholder ?? ''}
                handleChange={handleOnChangeOptions}
                options={options}
                value={selectedTemplate}
                noOptionsMessage={noOptionsMessage || (() => 'No options')}
              />
              {(selectedTemplate ||
                value?.templateName ||
                hasEditorContent) && (
                <div className="mb-3">
                  <CloseButton
                    onClick={onClearTemplate}
                    closeText={clearLabel}
                    variant="outline-danger"
                  />
                </div>
              )}
            </>
          )}
          <EditorInput
            {...props}
            ref={quillRef}
            label=""
            className={sourceOptions ? '' : 'ql-container-no-select'}
            placeholder=""
            bullet
            ordered
            docCreator={docCreator}
            loading={loading}
          />
          <div className="container-action-buttons">
            <GreenButton
              label="Save changes"
              plusIcon={false}
              onClick={onModalSubmit}
              disabled={error}
            />
            <CloseButton
              onClick={close}
              closeText="Close"
              variant="outline-danger"
            />
          </div>
        </BModal.Body>
      </BModal>
    </>
  );
};

export default ModalEditor;
