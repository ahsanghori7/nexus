import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { sizeFileIsCorrect } from 'v2/helpers/files';
import { StyledButon } from './Content.styled';

const { upload } = CONSTANTS.s3;

const PLACEHOLDER = '0,000,00.00';
const theme = 'prosper-send-quotation';
const maxSize = 100;

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

        useEffect(() => {
          trigger(['document']);
          if (documents && updateDocumentsToSend) {
            updateDocumentsToSend(documents);
          }
        }, [documents]);

        return (
          <>
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
            <InputForm
              autoComplete="programme"
              label={
                <>
                  Programme <span>(Weeks)</span>
                </>
              }
              errors={errors}
              register={register}
              placeholder="Eg: 2 Weeks"
              name="programme"
              type="text"
              rules={{
                required: 'Programme is required',
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
            <StyledButon
              id="submit-button"
              type="submit"
              layout="square"
              color="prosperGreenButton"
              disabled={disabledSubmit}
            >
              {t('send-quotation')}
            </StyledButon>
          </>
        );
      }}
    />
  );
};

export default Form;
