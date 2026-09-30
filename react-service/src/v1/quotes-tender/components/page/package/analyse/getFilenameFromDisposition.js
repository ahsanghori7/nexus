const stripQuotes = (value) => value.replace(/^["']|["']$/g, '').trim();

const parseFilenameStar = (disposition) => {
  const match = disposition.match(/filename\*=(?:UTF-8''|utf-8'')([^;\n]+)/i);
  if (!match?.[1]) {
    return null;
  }
  const encoded = match[1].trim();
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
};

const parseFilename = (disposition) => {
  const quotedMatch = disposition.match(/filename=(["'])([^"']+)\1/i);
  if (quotedMatch?.[2]) {
    return stripQuotes(quotedMatch[2]);
  }

  const unquotedMatch = disposition.match(/filename=([^;\n]+)/i);
  if (unquotedMatch?.[1]) {
    return stripQuotes(unquotedMatch[1]);
  }

  return null;
};

/** Extract download filename from Content-Disposition (quoted, unquoted, or RFC 5987 filename*). */
const getFilenameFromDisposition = (disposition, fallback) => {
  if (!disposition || typeof disposition !== 'string') {
    return fallback;
  }

  const fromStar = parseFilenameStar(disposition);
  if (fromStar) {
    return fromStar;
  }

  const fromFilename = parseFilename(disposition);
  return fromFilename || fallback;
};

export default getFilenameFromDisposition;
