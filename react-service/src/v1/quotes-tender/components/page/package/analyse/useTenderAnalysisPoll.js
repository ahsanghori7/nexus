import { useEffect } from 'react';
import { useContext } from 'v2/hooks/context';

const POLL_SECONDS = 10;

/**
 * Polling for tender analysis — per-package seconds from Redux.
 */
const useTenderAnalysisPoll = ({ tid, seconds, dispatch, enabled = true }) => {
  const context = useContext('clink');
  const { actions } = context;

  useEffect(() => {
    if (!enabled || !dispatch || !tid) {
      return undefined;
    }

    let interval;
    if (seconds > 0) {
      interval = setInterval(() => {
        dispatch(actions.setSeconds({ seconds: seconds - 1, tid }));
      }, 1000);
    }
    if (seconds === 0) {
      dispatch(actions.analyseFetch({ tid })).then((e) => {
        const { payload } = e;
        const pendingData =
          payload &&
          (payload.status === 'STARTED' || payload.status === 'PENDING');
        if (pendingData) {
          dispatch(actions.setSeconds({ seconds: POLL_SECONDS, tid }));
        } else {
          dispatch(actions.setSeconds({ seconds: -1, tid }));
        }
      });
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, enabled, tid]);
};

export default useTenderAnalysisPoll;
