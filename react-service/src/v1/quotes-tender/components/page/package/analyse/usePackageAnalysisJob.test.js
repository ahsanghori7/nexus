import React from 'react';
import { render } from '@testing-library/react';
import { QUOTE_LEVELING } from 'v2/store/reducers/clink/analyse-quote';
import usePackageAnalysisJob from './usePackageAnalysisJob';

const mockFetchArgs = jest.fn();

jest.mock('v2/hooks/context', () => ({
  useContext: () => ({
    actions: {
      analyseFetch: (args) => {
        mockFetchArgs(args);
        return () =>
          Promise.resolve({
            payload: { status: 'SUCCESS', package_id: args.tid },
          });
      },
      setCurrentTender: jest.fn(),
      setSeconds: jest.fn(),
      clearPackageJob: jest.fn(),
    },
  }),
}));

const Harness = ({ tid, type, dispatch, analysis, suspendFetch }) => {
  const { packageData } = usePackageAnalysisJob({
    tid,
    type,
    dispatch,
    analysis,
    suspendFetch,
  });
  return <div data-testid="status">{packageData?.status ?? 'none'}</div>;
};

describe('usePackageAnalysisJob', () => {
  beforeEach(() => {
    mockFetchArgs.mockClear();
  });

  it('reads SUCCESS from tenderJobsByPackageId without fetching', () => {
    const dispatch = jest.fn();

    const { getByText } = render(
      <Harness
        tid={43788}
        dispatch={dispatch}
        analysis={{
          tenderJobsByPackageId: {
            43788: { status: 'SUCCESS', package_id: 43788 },
          },
          data: { status: 'FAILURE', package_id: 42755 },
          currentTender: 42755,
        }}
      />,
    );

    expect(getByText('SUCCESS')).toBeInTheDocument();
    expect(mockFetchArgs).not.toHaveBeenCalled();
  });

  it('fetches when package has no entry in the jobs map', () => {
    const dispatch = jest.fn((thunk) => (typeof thunk === 'function' ? thunk() : thunk));

    render(
      <Harness
        tid={42755}
        dispatch={dispatch}
        analysis={{ tenderJobsByPackageId: {}, data: null, currentTender: 0 }}
      />,
    );

    expect(mockFetchArgs).toHaveBeenCalledWith({ tid: 42755 });
    expect(dispatch).toHaveBeenCalled();
  });

  it('does not fetch while suspendFetch is true', () => {
    const dispatch = jest.fn();

    render(
      <Harness
        tid={42755}
        dispatch={dispatch}
        analysis={{ tenderJobsByPackageId: {}, data: null, currentTender: 0 }}
        suspendFetch
      />,
    );

    expect(mockFetchArgs).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not fetch when job error is already set', () => {
    const dispatch = jest.fn();

    render(
      <Harness
        tid={42755}
        dispatch={dispatch}
        analysis={{
          tenderJobsByPackageId: {},
          tenderErrorsByPackageId: {
            42755: 'Too many requests',
          },
          tenderErrorPayloadsByPackageId: {
            42755: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Please wait' } },
          },
          data: null,
          currentTender: 0,
        }}
      />,
    );

    expect(mockFetchArgs).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
