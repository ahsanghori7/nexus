import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Grid2 from '@mui/material/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { CONSTANTS } from 'clink-components';
import { grayLight } from 'v2/constants/colors';
import i18next from 'v2/helpers/i18n';
import { httpHelperV2 } from 'v2/services/httpHelper';
import { Divider } from '@mui/material';

const { black, white } = CONSTANTS.colors.general;

const PdfDialog = ({
  open,
  onClose,
  pdfUrl,
  title = 'Tender Recommendation Report',
  projectId,
  recommendationId,
  isApprover,
  onApprove,
  onReject,
}) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);

      const response = await httpHelperV2({
        url: `project/${projectId}/tender_recommendation/${recommendationId}/report/preview`,
        method: 'GET',
        responseType: 'blob',
      });

      const blob =
        response instanceof Blob
          ? response
          : new Blob([response], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PDF download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setLoading(true);

      const response = await httpHelperV2({
        url: `project/${projectId}/tender_recommendation/${recommendationId}/report/preview`,
        method: 'GET',
        responseType: 'blob',
      });

      const blob =
        response instanceof Blob
          ? response
          : new Blob([response], { type: 'application/pdf' });

      const blobUrl = URL.createObjectURL(blob);

      // Create a hidden iframe for print
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          document.body.removeChild(iframe);
        }, 5000);
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PDF print failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    if (onApprove) {
      await onApprove();
    }
    setActionLoading(false);
  };

  const handleReject = () => {
    if (onReject) {
      onReject();
    }
  };
  return (
    <Dialog
      data-testid="pdf-dialog"
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: white,
        },
      }}
    >
      {/* Header */}
      <Grid2
        container
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 3,
          py: 2,
          borderBottom: `1px solid ${grayLight}`,
          backgroundColor: white,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>

        <Grid2 container alignItems="center" gap={1}>
          <Button data-testid="pdf-download-btn" variant="outlined" color="primary" onClick={handleDownload}>
            <DownloadIcon fontSize="small" /> {i18next.t('download-pdf-btn')}
          </Button>

          <Button data-testid="pdf-print-btn" variant="outlined" color="primary" onClick={handlePrint}>
            <PrintIcon fontSize="small" /> {i18next.t('print')}
          </Button>

          {isApprover && (
            <>
              <Divider orientation="vertical" variant="middle" flexItem />
              <Button
                data-testid="pdf-reject-btn"
                variant="outlined"
                color="primary"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {i18next.t('reject')}
              </Button>
              <Button
                data-testid="pdf-approve-btn"
                variant="contained"
                color="primary"
                onClick={handleApprove}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {i18next.t('approve')}
              </Button>
            </>
          )}

          <IconButton
            data-testid="pdf-close-btn"
            aria-label="close"
            onClick={onClose}
            sx={{ ml: 1, color: black }}
          >
            <CloseIcon />
          </IconButton>
        </Grid2>
      </Grid2>

      {/* PDF Content */}
      <DialogContent
        sx={{
          p: 0,
          height: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'auto',
          backgroundColor: white,
        }}
      >
        {loading && (
          <CircularProgress
            size={50}
            sx={{
              position: 'absolute',
            }}
          />
        )}

        <iframe
          data-testid="pdf-iframe"
          src={pdfUrl}
          title="PDF Preview"
          width="100%"
          height="100%"
          frameBorder="0"
          onLoad={() => setLoading(false)}
          style={{
            display: loading ? 'none' : 'block',
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PdfDialog;
