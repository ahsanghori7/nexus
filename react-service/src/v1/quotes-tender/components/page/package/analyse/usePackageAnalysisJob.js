import { useEffect, useRef, useState } from 'react';
import { useContext } from 'v2/hooks/context';
import { QUOTE_LEVELING, selectPackageJob } from 'v2/store/reducers/clink/analyse-quote';
import { isInProgressJobStatus } from './packageJobScope';

const POLL_SECONDS = 10;

/**
 * Reads per-package job from Redux (tenderJobsByPackageId / quoteLevelingJobsByPackageId)
 * and fetches once when this package has no cached job.
 */
const usePackageAnalysisJob = ({
  tid,
  type,
  dispatch,
  analysis,
  suspendFetch = false,
}) => {
  const context = useContext('clink');
  const { actions } = context;
  const { data: packageData, error: jobError, errorPayload: jobErrorPayload } =
    selectPackageJob(analysis, tid, type);
  const inFlightRef = useRef(false);
  const fetchedKeyRef = useRef(null);
  const [isHydrating, setIsHydrating] = useState(
    () =>
      !packageData &&
      Boolean(tid) &&
      !suspendFetch &&
      !jobError &&
      !jobErrorPayload,
  );

  useEffect(() => {
    if (!dispatch || !tid) {
      setIsHydrating(false);
      return undefined;
    }

    if (suspendFetch || jobError || jobErrorPayload) {
      setIsHydrating(false);
      return undefined;
    }

    if (packageData) {
      fetchedKeyRef.current = null;
      setIsHydrating(false);
      return undefined;
    }

    const fetchKey = `${tid}-${type ?? 'tender'}`;
    if (fetchedKeyRef.current === fetchKey || inFlightRef.current) {
      return undefined;
    }

    fetchedKeyRef.current = fetchKey;
    inFlightRef.current = true;
    setIsHydrating(true);

    const fetchArgs = type === QUOTE_LEVELING ? { tid, type: QUOTE_LEVELING } : { tid };
    const fetchResult = dispatch(actions.analyseFetch(fetchArgs));
    if (!fetchResult?.then) {
      inFlightRef.current = false;
      setIsHydrating(false);
      return undefined;
    }

    fetchResult.then((e) => {
      const { payload } = e;
      if (!payload) {
        return;
      }
      if (
        payload.package_id != null &&
        Number(payload.package_id) !== Number(tid)
      ) {
        return;
      }
      if (type !== QUOTE_LEVELING) {
        dispatch(actions.setCurrentTender(tid));
      }
      if (isInProgressJobStatus(payload.status)) {
        if (type === QUOTE_LEVELING) {
          dispatch(
            actions.setSeconds({ seconds: POLL_SECONDS, type: QUOTE_LEVELING, tid }),
          );
        } else {
          dispatch(actions.setSeconds({ seconds: POLL_SECONDS, tid }));
        }
      } else if (type === QUOTE_LEVELING) {
        dispatch(actions.setSeconds({ seconds: -1, type: QUOTE_LEVELING, tid }));
      } else {
        dispatch(actions.setSeconds({ seconds: -1, tid }));
      }
    }).finally(() => {
      inFlightRef.current = false;
      setIsHydrating(false);
    });

    return undefined;
  }, [dispatch, actions, tid, type, packageData, suspendFetch, jobError, jobErrorPayload]);

  const clearLocalJob = () => {
    dispatch(actions.clearPackageJob({ tid, type }));
  };

  return {
    packageData,
    clearLocalJob,
    isHydrating,
  };
};

export default usePackageAnalysisJob;
