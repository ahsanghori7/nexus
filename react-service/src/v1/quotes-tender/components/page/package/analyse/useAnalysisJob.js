import { useEffect } from 'react';
import { useContext } from 'v2/hooks/context';
import { QUOTE_LEVELING } from 'v2/store/reducers/clink/analyse-quote/analysisTypes';

const POLL_SECONDS = 10;

/** Polling for quote levelling (separate job state from tender analysis). */
const useAnalysisJob = ({ tid, type = QUOTE_LEVELING, enabled, seconds, dispatch }) => {
  const context = useContext('clink');
  const { actions } = context;

  useEffect(() => {
    if (!enabled || !dispatch || type !== QUOTE_LEVELING) {
      return undefined;
    }

    let interval;
    if (seconds > 0) {
      interval = setInterval(() => {
        dispatch(actions.setSeconds({ seconds: seconds - 1, type, tid }));
      }, 1000);
    }
    if (seconds === 0) {
      dispatch(actions.analyseFetch({ tid, type })).then((e) => {
        const { payload } = e;
        const pendingData =
          payload &&
          (payload.status === 'STARTED' || payload.status === 'PENDING');
        if (pendingData) {
          dispatch(actions.setSeconds({ seconds: POLL_SECONDS, type, tid }));
        } else {
          dispatch(actions.setSeconds({ seconds: -1, type, tid }));
        }
      });
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, enabled, tid, type]);
};

export default useAnalysisJob;
