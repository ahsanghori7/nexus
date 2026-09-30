import { readPackageJob } from 'v2/store/reducers/clink/analyse-quote/jobMaps';

/**
 * Tender analysis payload for the package modal — avoids stale global Redux errors
 * from another job (e.g. failed retry) when viewing SUCCESS for this package.
 */
const resolvePackageModalAnalysis = ({ packageId, openModal, analysis }) => {
  const modalForPackage =
    openModal?.id === 'analyse-quote-with-ai' &&
    Number(openModal?.packageId) === Number(packageId);

  const analysisData =
    readPackageJob(analysis, packageId) ??
    (modalForPackage ? openModal?.analysisData : null);

  const analysisStatus = analysisData?.status;
  const failureData =
    analysisStatus === 'FAILURE' || analysisStatus === 'UNPROCESSABLE';
  const hasData = analysisStatus === 'SUCCESS';
  const analysisError =
    !hasData && !failureData && Number(packageId) === Number(analysis?.currentTender)
      ? analysis?.error
      : null;

  return {
    analysisData,
    analysisStatus,
    failureData,
    hasData,
    analysisError,
  };
};

export default resolvePackageModalAnalysis;
