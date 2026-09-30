import React from 'react';
import ReactDropzone from 'react-dropzone';
import Form from 'react-bootstrap/Form';
import chunk from 'lodash/chunk';
import isEmpty from 'lodash/isEmpty';
import alert from 'v1/global/helpers/alert';
import ListOfItems from './list-of-items';
import Category from './list-of-items/Category';
import FileInput from './file-input';
import DropArea from './drop-area';

const Label = ({ name, label, required }) => (
  <Form.Label htmlFor={name}>
    {label} {required && <div className="required">*</div>}
  </Form.Label>
);

const EMPTY_FILES = 0;
const UPLOAD_BATCH_NUMBER = 3;

class Dropzone extends React.Component {
  constructor(props) {
    super(props);
    let files = [];
    const { inputProps } = props;
    if (inputProps) {
      const { value: formikFiles } = inputProps;
      files = formikFiles;
    }
    this.state = {
      files,
      uploading: false,
      objectiveFiles: 0,
      currentUploadingFile: '',
    };
    this.handleOndrop = this.handleOndrop.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.updateFormikState = this.updateFormikState.bind(this);
  }

  handleOndrop(acceptedFiles) {
    let filesFromInput = acceptedFiles;
    if (acceptedFiles.target) {
      filesFromInput = acceptedFiles.target.value;
    }
    const { files: currentFiles } = this.state;
    const { inputProps } = this.props;
    const { id, fetch, callback } = inputProps;
    const objectiveFiles = filesFromInput.length + currentFiles.length;
    this.setState({ uploading: true, objectiveFiles });
    if (fetch) {
      const chunkOfFiles = chunk(filesFromInput, UPLOAD_BATCH_NUMBER);
      const recursiveCall = async (currentChunk, packId, thisObject) => {
        if (currentChunk && currentChunk.length) {
          const [first, ...rest] = currentChunk;
          const promises = first.map((file) => ({
            call: () => fetch(packId, file),
            file,
          }));

          await Promise.all(
            promises.map((p) =>
              p
                .call()
                .then((response) => {
                  const { id: fileId, success, errorMessage = '' } = response;
                  const { file } = p;
                  thisObject.setState((prevState) => {
                    const { files } = prevState;
                    const fileFound = (fileObj) => {
                      return (
                        fileId && Number(fileObj.file.id) === Number(fileId)
                      );
                    };
                    if (files && !isEmpty(files) && files.find(fileFound)) {
                      thisObject.updateFormikState([...prevState.files]);
                      return {
                        files: [...prevState.files],
                      };
                    }
                    const newFileState = [
                      ...prevState.files,
                      {
                        file,
                        error: !(success && fileId),
                        id: fileId,
                        errorMessage,
                      },
                    ];
                    thisObject.updateFormikState(newFileState);
                    return { files: newFileState };
                  });
                  return { ...response, file: p.file };
                })
                .catch(() =>
                  thisObject.setState((prevState) => {
                    const { file } = p;
                    const { files } = prevState;
                    const newFileState = [
                      ...files,
                      {
                        file,
                        error: true,
                        id: null,
                      },
                    ];
                    thisObject.updateFormikState(newFileState);
                    return { files: newFileState };
                  }),
                ),
            ),
          ).then(() => recursiveCall(rest, packId, thisObject));

          thisObject.setState((prevState) => {
            if (prevState.files.length === objectiveFiles) {
              return {
                uploading: false,
                objectiveFiles: 0,
                currentUploadingFile: '',
              };
            }
            return false;
          });
        } else {
          // eslint-disable-next-line no-unused-expressions
          callback && callback();
        }
      };
      recursiveCall(chunkOfFiles, id, this);
    } else {
      filesFromInput.forEach((file) => {
        const newFile = file;
        return this.setState((prevState) => {
          const newFileState = [
            ...prevState.files,
            {
              file: newFile,
              error: false, // TODO: Check if could be some error here
            },
          ];
          this.updateFormikState(newFileState);

          if (newFileState.length === objectiveFiles) {
            return {
              files: newFileState,
              uploading: false,
              objectiveFiles: 0,
              currentUploadingFile: '',
            };
          }

          return {
            files: newFileState,
            uploading: false,
            objectiveFiles: 0,
            currentUploadingFile: '',
          };
        });
      });
    }
  }

  handleRemove(fileToRemove) {
    const { inputProps } = this.props;
    const { removeFile } = inputProps;
    if (removeFile) {
      removeFile(fileToRemove.id).then((result) => {
        if (result && result.success) {
          this.setState((prevState) => {
            const { files: prevFiles } = prevState;
            const files = prevFiles.filter(
              (fileObject) => fileObject.id !== fileToRemove.id,
            );
            this.updateFormikState(files);
            return { files };
          });
        } else {
          alert({ success: false });
        }
      });
    } else {
      this.setState((prevState) => {
        const { files: prevFiles } = prevState;
        const files = prevFiles.filter(
          (fileObject) => fileObject.file.name !== fileToRemove.file.name,
        );
        this.updateFormikState(files);
        return { files };
      });
    }
  }

  updateFormikState(value) {
    const { inputProps } = this.props;
    if (inputProps) {
      const { name, setFieldValue } = inputProps;
      setFieldValue(name, value);
    }
  }

  render() {
    const { files, uploading, objectiveFiles, currentUploadingFile } =
      this.state;
    const { inputProps, checkValues = [] } = this.props;
    const {
      name,
      label,
      id,
      handleDeleteCategory,
      setFieldValue,
      value,
      fieldName,
      ...rest
    } = inputProps;
    const barWidth = (files.length / objectiveFiles) * 100;
    let inputFormikProps = {};
    if (inputProps) {
      inputFormikProps = { ...rest };
    }

    const errors = files.length
      ? files.reduce(
          (accumulator, fileObj) => accumulator + Number(fileObj.error),
          EMPTY_FILES,
        )
      : EMPTY_FILES;
    const hasErrors = Boolean(errors);
    const secondLine = (
      <>
        {`${files.length}/${objectiveFiles} uploaded`}
        <span className={`errors${hasErrors ? ' errors--has-errors' : ''}`}>
          {errors} error(s)
        </span>
      </>
    );
    return uploading ? (
      <>
        {name && label && <Label label={label} name={name} />}
        <DropArea
          firstLine={currentUploadingFile}
          secondLine={secondLine}
          uploading
          barWidth={barWidth}
          hasErrors={hasErrors}
        />
      </>
    ) : (
      <ReactDropzone onDrop={this.handleOndrop}>
        {({ getRootProps, getInputProps }) => {
          const { style, ...restInputProps } = getInputProps();
          return files.length ? (
            <>
              <ListOfItems
                fileCategory={label}
                  files={files}
                  id={id}
                  checkValues={checkValues}
                  handleDeleteCategory={handleDeleteCategory}
                  categoryValue={value}
                  setFieldValue={setFieldValue}
                  fieldName={fieldName}
                handleRemove={this.handleRemove}
              />
              <div {...getRootProps()}>
                <FileInput
                  {...inputFormikProps}
                  {...restInputProps}
                  className="dropzone__input"
                />
              </div>
            </>
          ) : (
            <>
              {name && label && (
                <Category
                  id={id}
                  files={[]}
                  name={label}
                  checkValues={checkValues}
                  handleDeleteCategory={handleDeleteCategory}
                  categoryValue={value}
                  setFieldValue={setFieldValue}
                  fieldName={fieldName}
                />
              )}
              <DropArea
                rootProps={getRootProps()}
                inputProps={getInputProps()}
              />
            </>
          );
        }}
      </ReactDropzone>
    );
  }
}

export default Dropzone;
