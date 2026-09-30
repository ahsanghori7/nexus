import React from 'react';
import { render } from '@testing-library/react';
import { QUOTE_LEVELING } from 'v2/store/reducers/clink/analyse-quote/analysisTypes';
import useAnalysisJob from './useAnalysisJob';

const mockSetSeconds = jest.fn();
const mockAnalyseFetch = jest.fn(() => Promise.resolve({ payload: null }));

jest.mock('v2/hooks/context', () => ({
  useContext: () => ({
    actions: {
      setSeconds: (args) => mockSetSeconds(args),
      analyseFetch: (args) => mockAnalyseFetch(args),
    },
  }),
}));

const Harness = ({ tid, type, enabled, seconds, dispatch }) => {
  useAnalysisJob({ tid, type, enabled, seconds, dispatch });
  return null;
};

describe('useAnalysisJob', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSetSeconds.mockClear();
    mockAnalyseFetch.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does nothing when disabled', () => {
    const dispatch = jest.fn((thunk) => (typeof thunk === 'function' ? thunk() : thunk));
    render(
      <Harness tid="123" type={QUOTE_LEVELING} enabled={false} seconds={5} dispatch={dispatch} />,
    );

    jest.advanceTimersByTime(2000);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does nothing when dispatch is missing', () => {
    render(
      <Harness tid="123" type={QUOTE_LEVELING} enabled seconds={5} dispatch={undefined} />,
    );

    jest.advanceTimersByTime(2000);

    expect(mockSetSeconds).not.toHaveBeenCalled();
  });

  it('does nothing when type is not QUOTE_LEVELING', () => {
    const dispatch = jest.fn((thunk) => (typeof thunk === 'function' ? thunk() : thunk));
    render(
      <Harness tid="123" type="tender_analysis" enabled seconds={5} dispatch={dispatch} />,
    );

    jest.advanceTimersByTime(2000);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('defaults type to QUOTE_LEVELING when omitted', () => {
    const dispatch = jest.fn((thunk) => (typeof thunk === 'function' ? thunk() : thunk));
    render(<Harness tid="123" enabled seconds={5} dispatch={dispatch} />);

    jest.advanceTimersByTime(1000);

    expect(mockSetSeconds).toHaveBeenCalledWith({ seconds: 4, type: QUOTE_LEVELING, tid: '123' });
  });

  it('counts down seconds on an interval while enabled', () => {
    const dispatch = jest.fn((thunk) => (typeof thunk === 'function' ? thunk() : thunk));
    render(
      <Harness tid="123" type={QUOTE_LEVELING} enabled seconds={5} dispatch={dispatch} />,
    );

    jest.advanceTimersByTime(1000);

    expect(mockSetSeconds).toHaveBeenCalledWith({ seconds: 4, type: QUOTE_LEVELING, tid: '123' });
  });

  it('polls and reschedules when a pending fetch resolves with STARTED status', async () => {
    mockAnalyseFetch.mockResolvedValueOnce({ payload: { status: 'STARTED' } });
    const dispatch = jest.fn((thunk) => (typeof thunk === 'function' ? thunk() : thunk));
    render(
      <Harness tid="123" type={QUOTE_LEVELING} enabled seconds={0} dispatch={dispatch} />,
    );

    expect(mockAnalyseFetch).toHaveBeenCalledWith({ tid: '123', type: QUOTE_LEVELING });
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSetSeconds).toHaveBeenCalledWith({
      seconds: 10,
      type: QUOTE_LEVELING,
      tid: '123',
    });
  });

  it('stops polling when a pending fetch resolves with a completed status', async () => {
    mockAnalyseFetch.mockResolvedValueOnce({ payload: { status: 'SUCCESS' } });
    const dispatch = jest.fn((thunk) => (typeof thunk === 'function' ? thunk() : thunk));
    render(
      <Harness tid="123" type={QUOTE_LEVELING} enabled seconds={0} dispatch={dispatch} />,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(mockSetSeconds).toHaveBeenCalledWith({ seconds: -1, type: QUOTE_LEVELING, tid: '123' });
  });

  it('clears the interval on unmount', () => {
    const dispatch = jest.fn((thunk) => (typeof thunk === 'function' ? thunk() : thunk));
    const { unmount } = render(
      <Harness tid="123" type={QUOTE_LEVELING} enabled seconds={5} dispatch={dispatch} />,
    );

    unmount();
    jest.advanceTimersByTime(5000);

    expect(mockSetSeconds).not.toHaveBeenCalled();
  });
});
