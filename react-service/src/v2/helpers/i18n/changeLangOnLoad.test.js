import { change } from './func';

// Mock the func module
jest.mock('./func', () => ({
  change: jest.fn(),
}));

const loadChangeLangOnLoad = async () => {
  await jest.isolateModulesAsync(async () => {
    await import('./changeLangOnLoad');
  });
};

describe('changeLangOnLoad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call change function on module load', async () => {
    // The import itself triggers the change() call
    await loadChangeLangOnLoad();

    expect(change).toHaveBeenCalledTimes(1);
  });
});
