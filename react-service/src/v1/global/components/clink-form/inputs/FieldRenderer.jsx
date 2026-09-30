import React, { useState } from 'react';
import isNil from 'lodash/isNil';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InputField from './InputField';
import MoneyField from './money-field';
import SelectField from './select-field';
import EditorField from './editor-field';
import DateField from './date-field';
import DropzoneField, { AddDropzoneModal } from './dropzone-field';
import File from './File';
import FilemanagerField from './FilemanagerField';
import FieldHolder from '../FieldHolder';
import FieldLabel from '../FieldLabel';
import i18next from 'v2/helpers/i18n';
import { AsiteGuideTrigger } from 'v2/apps/clink/pages/pmp/add-project/AsiteGuide';
import AsiteFolderMissingHelpDialog from './AsiteFolderMissingHelpDialog';

const FieldRenderer = ({
  field,
  values,
  errors = {},
  autoSelectUniqueOption = false,
  setFieldValue,
  validationFieldSchema,
  handleChange,
  setValidations,
  fetch = null,
  removeFile = null,
  callback = null,
  customErrors = {},
  triggerCustomErrors = false,
  optionIsDisable = null,
  menuPortalTarget = null,
  portalId = null,
  fileManagerButton = () => null,
}) => {
  const {
    type,
    name: fieldName,
    as,
    calendar,
    labelIcon,
    attachment = true,
    bullet = true,
    ordered = true,
    modal = false,
    docCreator = false,
    isClearable = false,
    CustomContent = null,
    message = '',
  } = field;
  const setValidation = isNil(setValidations)
    ? null
    : setValidations[fieldName];
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      {field.type && type === 'editor' && (
        <EditorField
          {...field}
          validationFieldSchema={validationFieldSchema}
          setFieldValue={setFieldValue}
          value={values[fieldName]}
          attachment={attachment}
          bullet={bullet}
          ordered={ordered}
          modal={modal}
          docCreator={docCreator}
          error={errors[fieldName]}
        />
      )}
      {type && type === 'dropzone' && (
        <DropzoneField
          {...field}
          validationFieldSchema={validationFieldSchema}
          setFieldValue={setFieldValue}
          value={values[fieldName]}
          fetch={fetch}
          removeFile={removeFile}
          callback={callback}
        />
      )}
      {type && type === 'multi-dropzone' && (
        <>
          {field.values.map((dropzoneData) => {
            const {
              label: dropzoneLabel,
              name: dropzoneName,
              key: dropzoneKey,
            } = dropzoneData;
            const newSetFieldValue = (_, value) => {
              const newValues = { ...values[fieldName] };
              newValues[dropzoneName] = value;
              return setFieldValue(fieldName, newValues);
            };

            const isNestedStructure =
              dropzoneName &&
              values[fieldName] &&
              typeof values[fieldName] === 'object' &&
              Object.keys(values[fieldName]).length > 0;

            const dropzoneValue = isNestedStructure
              ? values[fieldName][dropzoneName]
              : values[fieldName];

            const dropzoneSetFieldValue = isNestedStructure
              ? newSetFieldValue
              : setFieldValue;

            return (
              values[fieldName][dropzoneName] && (
                <DropzoneField
                  {...field}
                  key={dropzoneKey}
                  id={dropzoneKey}
                  label={dropzoneLabel}
                  validationFieldSchema={validationFieldSchema}
                  setFieldValue={dropzoneSetFieldValue}
                  value={dropzoneValue}
                  fetch={fetch}
                  removeFile={removeFile}
                  callback={callback}
                  handleDeleteCategory={field.handleDeleteCategory}
                  fieldName={fieldName}
                />
              )
            );
          })}
          <AddDropzoneModal
            fieldName={fieldName}
            value={values[fieldName]}
            setFieldValue={setFieldValue}
            handleSetDropzone={field.handleSetDropzone}
          />
        </>
      )}
      {type &&
        !calendar &&
        type !== 'editor' &&
        type !== 'dropzone' &&
        type !== 'multi-dropzone' &&
        type !== 'pdf' &&
        type !== 'filemanager' &&
        type !== 'money' && (
          <InputField
            {...field}
            validationFieldSchema={validationFieldSchema}
            setFieldValue={setFieldValue}
            value={values[fieldName]}
            error={errors[fieldName]}
            handleChange={handleChange}
            setValidation={setValidation}
            customErrors={customErrors}
            triggerCustomErrors={triggerCustomErrors}
          >
            {labelIcon ? <FontAwesomeIcon icon={labelIcon} /> : null}
          </InputField>
        )}
      {type && type === 'money' && (
        <MoneyField
          {...field}
          validationFieldSchema={validationFieldSchema}
          setFieldValue={setFieldValue}
          value={values[fieldName]}
          error={errors[fieldName]}
          handleChange={handleChange}
          setValidation={setValidation}
          customErrors={customErrors}
          triggerCustomErrors={triggerCustomErrors}
        >
          {labelIcon ? <FontAwesomeIcon icon={labelIcon} /> : null}
        </MoneyField>
      )}
      {type && calendar && (
        <DateField
          {...field}
          handleChange={setFieldValue}
          validationFieldSchema={validationFieldSchema}
          setValidation={setValidation}
          customErrors={customErrors}
          error={errors[fieldName]}
          value={values[fieldName]}
          isClearable={isClearable}
          portalId={portalId}
          triggerCustomErrors={triggerCustomErrors}
          CustomContent={CustomContent}
          message={message}
        >
          {labelIcon ? <FontAwesomeIcon icon={labelIcon} /> : null}
        </DateField>
      )}
      {type && type === 'filemanager' && (
        <FilemanagerField {...field} fileManagerButton={fileManagerButton} />
      )}
      {as &&
        (field.hasAsiteFolders === false ? (
          <>
            <FieldHolder
              className={`${field.className || ''} asite-folder-fallback`}
            >
              <FieldLabel
                name={fieldName}
                label={field.label}
                required={field.required}
              >
                {labelIcon ? <FontAwesomeIcon icon={labelIcon} /> : null}
              </FieldLabel>
              <Box
                className="asite-folder-fallback-message"
                padding={2.5}
                border="1px solid"
                borderColor="divider"
                display="flex"
                flexDirection="column"
                alignItems="center"
                textAlign="center"
                gap={1.5}
                mt={2}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningAmberIcon fontSize="medium" color="warning" />
                  <Typography variant="h6" fontWeight={600} color="warning">
                    {i18next.t('no-package-folders-available')}
                  </Typography>
                </Box>
                <Typography variant="body1" lineHeight={1.5}>
                  {i18next.t('no-package-folders-available-description')}
                </Typography>
                <AsiteGuideTrigger
                  onClick={() => setShowGuide(true)}
                  linkTranslationKey="asite-folder-missing-help-title"
                />
              </Box>
            </FieldHolder>
            <AsiteFolderMissingHelpDialog
              open={showGuide}
              onClose={() => setShowGuide(false)}
            />
          </>
        ) : (
          <SelectField
            {...field}
            value={values[fieldName]}
            error={errors[fieldName]}
            handleChange={setFieldValue}
            validationFieldSchema={validationFieldSchema}
            setValidation={setValidation}
            customErrors={customErrors}
            autoSelectUniqueOption={autoSelectUniqueOption}
            triggerCustomErrors={triggerCustomErrors}
            optionIsDisable={optionIsDisable}
            menuPortalTarget={menuPortalTarget}
          >
            {labelIcon ? <FontAwesomeIcon icon={labelIcon} /> : null}
          </SelectField>
        ))}
      {type && type === 'pdf' && <File {...field} value={values[fieldName]} />}
    </>
  );
};

export default FieldRenderer;
