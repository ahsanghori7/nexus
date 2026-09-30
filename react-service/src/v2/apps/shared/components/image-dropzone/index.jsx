import React from 'react';
import {
  DropzoneWrapper,
  DropzoneContent,
  DropzoneIcon,
  DropzoneFileList,
  DropzoneFooter,
  InputForm,
  Image,
  CONSTANTS,
} from 'clink-components';
import { useTranslation } from 'react-i18next';
import { MuiCompanyAvatar, MuiInvalidInput } from '../company-v2/Mui.styled';

const { upload } = CONSTANTS.s3;

const ImageDropzone = ({
  theme = 'prosper',
  name = 'image',
  maxSize = 0.5,
  onFileSelect,
  onDelete,
  existingImageUrl,
  register,
  errors,
  rules,
  fileErrorMessage = '',
  hideDropzoneIfPreview = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const previewVisible = Boolean(existingImageUrl);

  return (
    <InputForm
      errors={errors}
      name={name}
      type="dropzone"
      theme={theme}
      register={register}
      className={className}
      rules={{
        ...rules,
        onChange: onFileSelect,
      }}
      documents={previewVisible ? [{ id: 1, url: existingImageUrl }] : []}
    >
      <DropzoneWrapper theme={theme}>
        {previewVisible && hideDropzoneIfPreview ? (
          <MuiCompanyAvatar picSrc={existingImageUrl} onDelete={onDelete} />
        ) : (
          <>
            <DropzoneIcon theme={theme}>
              <Image src={upload} />
            </DropzoneIcon>
            <DropzoneContent theme={theme}>
              <p className="prosper-drag">{t('drag-and-drop-image')}</p>
              <p>{t('or')}</p>
              <button type="button">{t('choose-file')}</button>
            </DropzoneContent>
            <DropzoneFileList
              theme={theme}
              files={previewVisible ? [{ id: 1, url: existingImageUrl }] : []}
            />
            <DropzoneFooter theme={theme}>
              {t('file-size-no-bigger-than')} {maxSize * 1000}k,{' '}
              {t('image-should-be-jpg-png')}
            </DropzoneFooter>
            {fileErrorMessage && (
              <MuiInvalidInput>{fileErrorMessage}</MuiInvalidInput>
            )}
          </>
        )}
      </DropzoneWrapper>
    </InputForm>
  );
};

export default ImageDropzone;
