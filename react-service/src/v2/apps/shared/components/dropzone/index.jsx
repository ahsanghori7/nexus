import React, { useEffect, useState } from 'react';
import {
  InputForm,
  Image,
  CONSTANTS,
  DropzoneWrapper,
  DropzoneContent,
  DropzoneIcon,
  DropzoneAccordionFileList,
} from 'clink-components';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import chunk from 'lodash/chunk';
import flattenDeep from 'lodash/flattenDeep';
import { useContext } from 'hooks/context';
import {
  sizeFileIsCorrect,
  typeFileIsAccepted,
  DEFAULT_MAX_SIZE_MB,
} from 'v2/helpers/files';
import { getQueryStringVars } from 'v2/helpers/url';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const { uploadSvg } = CONSTANTS.s3;
const { red } = CONSTANTS.colors.general;

const uploadingBoxStyles = {
  display: 'flex',
  flexDirection: 'column',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  '& p': {
    maxWidth: '200px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '& .file-error-message': {
    whiteSpace: 'initial',
    color: red,
  },
};

const Dropzone = ({
  data,
  errors,
  register,
  instructionsDocuments,
  contextType = 'clink',
  theme = 'c-link',
  dispatch,
}) => {
  const [filesToUpload, setFilesToUpload] = useState([]);
  const context = useContext(contextType);
  const { actions } = context;
  const { t } = useTranslation();
  const { uploadingDocumentsState, documents, firstLoaded } =
    instructionsDocuments;
  const {
    currentDocs,
    current,
    uploaded,
    uploading,
    total,
    errors: errorDocs,
    DOCS_PER_REQUEST,
  } = uploadingDocumentsState;
  const { id } = getQueryStringVars();

  useEffect(() => {
    if (currentDocs && filesToUpload && filesToUpload.length) {
      const chunkFiles = chunk(filesToUpload, DOCS_PER_REQUEST);
      const [firstBatch, ...rest] = chunkFiles;
      setFilesToUpload(flattenDeep(rest));
      dispatch(
        actions.addDocument({
          id,
          data: firstBatch,
        }),
      );
    }
  }, [currentDocs, filesToUpload, DOCS_PER_REQUEST, dispatch, actions, id]);

  useEffect(() => {
    if (firstLoaded && data && data.documents) {
      dispatch(actions.initialDocumentUpdate(data.documents));
    }
  }, [data, firstLoaded, dispatch, actions]);

  return (
    <Box sx={{ flexBasis: '100%', position: 'relative' }}>
      <InputForm
        label="Attach documents"
        errors={errors}
        name="documents"
        type="dropzone"
        theme={theme}
        loadedImage={<Image src={uploadSvg} />}
        register={register}
        onBlur={() => trigger(['dropzone'])}
        multiple
        uploading={uploadingDocumentsState}
        documents={documents || []}
        rules={{
          onChange: (e) => {
            dispatch(
              actions.changeUploadingDocumentsState({
                key: 'errors',
                value: [],
              }),
            );

            const { files } = e.currentTarget;
            const filesArray = Array.from(files);

            const invalidSizeItems = filesArray.filter(
              (f) => !sizeFileIsCorrect(f),
            );
            const label =
              invalidSizeItems.length > 1
                ? 'file-too-large_other'
                : 'file-too-large_one';

            const invalidSizesFiles = invalidSizeItems.map((f) => ({
              name: f.name,
              invalid: t(label, {
                count: invalidSizeItems.length,
                size: DEFAULT_MAX_SIZE_MB,
              }),
            }));

            const invalidTypeItems = filesArray.filter(
              (f) => !typeFileIsAccepted(f) && sizeFileIsCorrect(f),
            );
            const invalidTypesFiles = invalidTypeItems.map((f) => ({
              name: f.name,
              invalid: t('invalid-type-file', {
                count: invalidTypeItems.length,
              }),
            }));

            const filesToSend = filesArray.filter(
              (f) => sizeFileIsCorrect(f) && typeFileIsAccepted(f),
            );

            if (invalidSizesFiles.length || invalidTypesFiles.length) {
              dispatch(
                actions.changeUploadingDocumentsState({
                  key: 'errors',
                  value: [...invalidSizesFiles, ...invalidTypesFiles],
                }),
              );
            }

            if (filesToSend.length) {
              setFilesToUpload(filesToSend);
              dispatch(
                actions.changeUploadingDocumentsState({
                  key: 'currentDocs',
                  value: filesToSend.length,
                }),
              );
              dispatch(
                actions.changeUploadingDocumentsState({
                  key: 'total',
                  value: filesToSend.length,
                }),
              );
            }
          },
        }}
      >
        <DropzoneWrapper theme={theme}>
          <DropzoneIcon theme={theme}>
            <Image src={uploadSvg} />
          </DropzoneIcon>
          <DropzoneContent theme={theme}>
            {!uploading && (
              <>
                <p>Drag and drop your file or</p>
                <button type="button">browse for your files</button>
              </>
            )}
            {uploading && total && (
              <Box className="uploading-box" sx={uploadingBoxStyles}>
                <small className="uploading">Uploading</small>
                <p>{current}</p>
                <div>
                  <small className="file-uploaded">
                    {uploaded}/{total} uploaded
                  </small>
                  <small className="file-errors">
                    {errorDocs.length} error(s)
                  </small>
                </div>
              </Box>
            )}

            <Typography component="p">
              (Maximum file size: {DEFAULT_MAX_SIZE_MB}MB per file)
            </Typography>

            {Boolean(errorDocs.length) && (
              <Box className="uploading-box" sx={uploadingBoxStyles}>
                <div className="file-errors">
                  <p className="file-error-message">{errorDocs[0].invalid}</p>
                </div>
                <small className="file-errors-count">
                  {errorDocs.length} error{errorDocs.length > 1 ? 's' : ''}
                </small>
              </Box>
            )}
          </DropzoneContent>
        </DropzoneWrapper>

        <DropzoneAccordionFileList
          theme={theme}
          handleDelete={(selectedDoc) => {
            if (selectedDoc && selectedDoc.id) {
              dispatch(actions.removeDocument(selectedDoc.id));
            }
          }}
          files={documents || []}
        />
      </InputForm>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  instructionsDocuments: state.instructionsDocuments,
});

export default connect(mapStateToProps)(Dropzone);
