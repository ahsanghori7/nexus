import Cookies from 'js-cookie';
import { QUOTE_LEVELING } from 'v2/store/reducers/clink/analyse-quote';
import { resolveAnalysisErrorMessage } from 'v2/store/reducers/clink/analyse-quote/httpErrors';
import buildAnalysisExportUrl from './buildAnalysisExportUrl';
import getFilenameFromDisposition from './getFilenameFromDisposition';

const getExportFallbackFilename = (packageId, format, type) => {
  if (type === QUOTE_LEVELING) {
    return `quote_levelling-${packageId}.xlsx`;
  }
  return `analysis-${packageId}.${format || 'docx'}`;
};

const readContentDisposition = (headers) =>
  headers?.get?.('Content-Disposition') ?? headers?.get?.('content-disposition') ?? null;

const readExportFilename = (headers, fallback) => {
  const disposition = readContentDisposition(headers);
  const fromDisposition = getFilenameFromDisposition(disposition, null);
  if (fromDisposition) {
    return fromDisposition;
  }
  const exportFilename =
    headers?.get?.('X-Export-Filename') ?? headers?.get?.('x-export-filename');
  if (exportFilename?.trim()) {
    return exportFilename.trim();
  }
  return fallback;
};

const downloadAnalysisExport = (packageId, format, type) => {
  if (!packageId) {
    return Promise.reject(new Error('Package ID is required for download'));
  }

  const url = buildAnalysisExportUrl(packageId, format, type);
  const token = Cookies.get(API.TOKEN_NAME);

  return fetch(`${API.RELAY_URL}${url}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        let errorPayload = null;
        try {
          errorPayload = await response.json();
        } catch (e) {
          errorPayload = null;
        }
        const message = resolveAnalysisErrorMessage(
          errorPayload ? { ...errorPayload, httpStatus: response.status } : null,
          response.statusText,
          'Unable to download analysis export.',
        );
        throw new Error(message);
      }
      const filename = readExportFilename(
        response.headers,
        getExportFallbackFilename(packageId, format, type),
      );
      return response.blob().then((blob) => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    });
};

export default downloadAnalysisExport;
