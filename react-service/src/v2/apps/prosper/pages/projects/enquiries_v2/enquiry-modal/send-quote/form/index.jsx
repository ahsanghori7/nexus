import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import {
  Form as ClinkForm,
  Image,
  InputForm,
  InputFormControlled,
  DropzoneWrapper,
  DropzoneIcon,
  DropzoneContent,
  DropzoneFooter,
  DropzoneFileList,
  CONSTANTS,
} from 'clink-components';
import MuiButton from '@mui/material/Button';
import { sizeFileIsCorrect } from 'v2/helpers/files';
import { dimGray2, SilverSand } from 'v2/constants/colors-prosper';

const { upload } = CONSTANTS.s3;

const PLACEHOLDER = '0,000,00.00';
const theme = 'prosper-send-quotation';
const maxSize = 100;

/* eslint-disable no-hex-colors/no-hex-colors */
const styleCurrency = {
  content: '"ASD"',
  position: 'absolute',
  left: '1px',
  top: '31px',
  zIndex: 1,
  backgroundColor: '#2b3946',
  height: '50px',
  width: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  borderTopLeftRadius: '6px',
  borderBottomLeftRadius: '6px',
  borderRight: '1px solid #3d4d5c',
  paddingTop: '4px',
  boxSizing: 'border-box',
  color: '#fff',
};

const Form = ({ handleSubmit, updateDocumentsToSend = null }) => {
  const [documents, setDocuments] = useState([]);
  const { t } = useTranslation();
  return (
    <ClinkForm
      data-testid="form-content"
      disableUntilValid
      defaultValues={{
        price: '',
        work: '',
        prelims: '',
        other: '',
        programme: '',
      }}
      method="POST"
      onSubmit={handleSubmit}
      render={(formHook) => {
        const { formState, register, control, setValue, trigger } = formHook;
        const { errors, isDirty, isValid } = formState;
        const disabledSubmit =
          !isDirty ||
          !isValid ||
          !documents ||
          (documents && !documents.length);

        const validateSize = (file) =>
          sizeFileIsCorrect(file, maxSize)
            ? ''
            : t('file-too-large', { count: 1 });

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          trigger(['document']);
          if (documents && updateDocumentsToSend) {
            updateDocumentsToSend(documents);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [documents]);

        const styles = { ...styleCurrency, content: `"${t('currency')}"` };
        return (
          <>
            <Box
              sx={{
                padding: '0 !important',
                overflowY: 'auto !important',
                '.clink-form__input:before': styles,
              }}
            >
              <InputFormControlled
                control={control}
                setValue={setValue}
                autoComplete="price"
                label="Quotation value"
                errors={errors}
                register={register}
                placeholder={PLACEHOLDER}
                name="price"
                type="currency"
                theme={theme}
                rules={{
                  required: 'Quotation value is required',
                }}
              />
            </Box>
            <Box
              sx={{
                padding: '0 !important',
                overflowY: 'auto !important',
                '.clink-form__input:before': styles,
              }}
            >
              <InputFormControlled
                control={control}
                setValue={setValue}
                autoComplete="work"
                label="Measured work value"
                errors={errors}
                register={register}
                placeholder={PLACEHOLDER}
                name="work"
                type="currency"
                rules={{
                  required: 'Measured work value is required',
                }}
              />
            </Box>
            <Box
              sx={{
                padding: '0 !important',
                overflowY: 'auto !important',
                '.clink-form__input:before': styles,
              }}
            >
              <InputFormControlled
                control={control}
                setValue={setValue}
                autoComplete="prelims"
                label="Prelims value"
                errors={errors}
                register={register}
                placeholder={PLACEHOLDER}
                name="prelims"
                type="currency"
                rules={{
                  required: 'Prelims work value is required',
                }}
              />
            </Box>
            <Box
              sx={{
                padding: '0 !important',
                overflowY: 'auto !important',
                '.clink-form__input:before': styles,
              }}
            >
              <InputFormControlled
                control={control}
                setValue={setValue}
                autoComplete="other"
                label="Provisional sum value"
                errors={errors}
                register={register}
                placeholder={PLACEHOLDER}
                name="other"
                type="currency"
                rules={{
                  required: 'Provisional sum value is required',
                }}
              />
            </Box>
            <InputForm
              autoComplete="programme"
              label={
                <>
                  Programme <span>(Weeks)</span>
                </>
              }
              errors={errors}
              register={register}
              placeholder="Eg: 2"
              name="programme"
              type="text"
              rules={{
                required: 'Programme is required',
                validate: (value) =>
                  /^\d+$/.test(String(value)) || 'Programme must be a number',
              }}
            />
            <InputForm
              documents={documents}
              errors={errors}
              register={register}
              name="document"
              type="dropzone"
              theme={theme}
              multiple
              setValue={setValue}
              trigger={trigger}
              rules={{
                validate: {
                  required: (fileList) => {
                    return Boolean(fileList.length);
                  },
                  size: () => {
                    const invalidFiles = [];
                    documents.forEach((f) => {
                      if (!sizeFileIsCorrect(f, maxSize)) {
                        invalidFiles.push(f.name);
                      }
                    });
                    return (
                      !invalidFiles.length ||
                      `${invalidFiles.join(', ')} (${t('file-too-large', {
                        count: invalidFiles.length,
                      })})`
                    );
                  },
                },
                onChange: (e) => {
                  const { files } = e.currentTarget;
                  if (files.length) {
                    const filesArray = [];
                    for (let i = 0; i < files.length; i++) {
                      filesArray.push(files[i]);
                    }
                    const newFiles = [...documents, ...filesArray];
                    setDocuments(newFiles);
                    trigger(['document']);
                  }
                },
              }}
            >
              <DropzoneWrapper theme={theme}>
                <DropzoneIcon theme={theme}>
                  <Image src={upload} />
                </DropzoneIcon>
                <DropzoneContent theme={theme}>
                  <p className="prosper-drag">Drag and drop your file here</p>
                  <p>Or</p>
                  <button type="button">Choose file</button>
                </DropzoneContent>
                <DropzoneFooter theme={theme}>
                  {t('file-size-no-bigger-than')} {maxSize} Mb
                </DropzoneFooter>
              </DropzoneWrapper>
              <DropzoneFileList
                theme={theme}
                files={documents}
                validate={validateSize}
                handleDelete={(doc, index) => {
                  if (doc) {
                    const newFiles = documents.filter((_d, i) => i !== index);
                    setDocuments(newFiles);
                    setValue('document', newFiles);
                    trigger(['document']);
                  }
                }}
              />
            </InputForm>
            <MuiButton
              id="submit-button"
              type="submit"
              variant="contained"
              color="success"
              size="large"
              disabled={disabledSubmit}
              sx={{
                '&.Mui-disabled': {
                  backgroundColor: SilverSand,
                  color: dimGray2,
                },
              }}
            >
              {t('send-quotation')}
            </MuiButton>
          </>
        );
      }}
    />
  );
};

export default Form;
