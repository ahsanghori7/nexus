import React from 'react';
import PropTypes from 'prop-types';
import {
  Container,
  Title,
  ProgressBarContainer,
  ProgressBar,
  ProgressText,
} from './styled';

const CALCULATION_BASE_UNIT_SIZE = 1024; // To convert total size to related unit this number is used as base unit size
const DEFAULT_SELECTED_TOTAL_SIZE = 0;

// This function gets size in bytes and calculates the size of files in proper units
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 bytes';

  const decimalPoint = decimals < 0 ? 0 : decimals;
  const sizes = ['bytes', 'kb', 'mb', 'gb', 'tb', 'pb', 'eb', 'zb', 'yb'];

  const indexForUnit = Math.floor(
    Math.log(bytes) / Math.log(CALCULATION_BASE_UNIT_SIZE)
  );

  return `${parseFloat(
    (bytes / CALCULATION_BASE_UNIT_SIZE ** indexForUnit).toFixed(decimalPoint)
  )} ${sizes[indexForUnit]}`;
};

const ProgressBarFileSize = ({ documents, label, maxLimitTotalFilesSize }) => {
  const fileDocumentsArrayValues = Object.values(documents); // documents is a dynamic objects of arrays. To get values of that object used Object.values (fileDocumentsArrayValues)

  const fileObjectArray =
    fileDocumentsArrayValues &&
    fileDocumentsArrayValues.map((document) =>
      document.map((item) => item.file)
    ); //  accessing sub level files objects by map function (fileObjectArray)
  const filesArray = fileObjectArray && fileObjectArray.flat(1); // flat(1) means converting array of file to one level array like array(3),array(2),array(1)  ===>  array(6)

  const fileSizeSum =
    filesArray && filesArray.length
      ? filesArray.reduce((accumulator, fileObj) => {
          const sizeInBytes = fileObj.size;
          return accumulator + sizeInBytes;
        }, DEFAULT_SELECTED_TOTAL_SIZE)
      : DEFAULT_SELECTED_TOTAL_SIZE;

  const calculatedSizeOfFiles = `${formatBytes(
    fileSizeSum
  )} / ${maxLimitTotalFilesSize} mb`;

  const sizeInMegaBytes =
    fileSizeSum / (CALCULATION_BASE_UNIT_SIZE * CALCULATION_BASE_UNIT_SIZE); // convert bytes to mb for calculating percentage according to mb
  const percent = maxLimitTotalFilesSize
    ? (sizeInMegaBytes / maxLimitTotalFilesSize) * 100
    : DEFAULT_SELECTED_TOTAL_SIZE; // calculating percentage. If maxLimitTotalFilesSize==0 return 0

  return (
    <Container>
      <Title>{label}</Title>
      <ProgressBarContainer>
        <ProgressText>{calculatedSizeOfFiles}</ProgressText>
        <ProgressBar percent={percent} />
      </ProgressBarContainer>
    </Container>
  );
};

ProgressBarFileSize.defaultProps = {
  label: 'File Size Progress Bar',
  maxLimitTotalFilesSize: 200,
  documents: {},
};

ProgressBarFileSize.propTypes = {
  label: PropTypes.string,
  maxLimitTotalFilesSize: PropTypes.number,
  documents: PropTypes.object,
};

export default ProgressBarFileSize;
