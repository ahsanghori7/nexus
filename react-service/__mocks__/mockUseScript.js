// Mock for useScript hook used in prosper resources pages
const useScript = jest.fn((src) => {
  // Mock implementation that simulates script loading
  return true;
});

export default useScript;
