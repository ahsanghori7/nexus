const flag = jest.fn((key) => {
  if (key === 'PROSPER_ENQUIRIES_MUI_PAGINATION') {
    return 6; // Default value from extraReducers.js
  }
  return undefined;
});
export default flag;
