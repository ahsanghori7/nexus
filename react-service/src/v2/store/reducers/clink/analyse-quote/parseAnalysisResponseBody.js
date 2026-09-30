/** Empty 200 from initiate/export should mean no job payload, not a parse failure. */
const parseAnalysisResponseBody = (text) => {
  if (text == null || !String(text).trim()) {
    return null;
  }
  return JSON.parse(text);
};

export default parseAnalysisResponseBody;
