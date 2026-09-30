import React, { useMemo, useRef, useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import { aiEligibleBg } from 'v2/constants/colors';
import {
  ACCEPTED_EXTENSIONS,
  EXTENSION_TO_MAX_MB,
  MAX_FILE_SIZE_BYTES_BY_EXTENSION,
} from './constants';
import { isSpreadsheetExtension, readWorkbookSheetNames } from './excelSheets';
import { normalizeSelectedSheets } from 'v2/apps/clink/pages/boq/buildGenerateBoqFormData';

const {
  clinkGreen,
  clinkLightPurple,
  brightGray,
  white,
  black,
  clinkRed,
  lightGreen,
} = CONSTANTS.colors.general;

const getExtension = (fileName = '') => {
  const parts = String(fileName).split('.');
  return (parts[parts.length - 1] || '').toLowerCase();
};

const validateSingleFile = (file) => {
  if (!file) {
    return { ok: false, errorKey: 'boq-smart-builder-error-required' };
  }
  const ext = getExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return { ok: false, errorKey: 'boq-smart-builder-error-type' };
  }

  const maxBytes = MAX_FILE_SIZE_BYTES_BY_EXTENSION[ext];
  if (Number.isFinite(maxBytes) && file.size > maxBytes) {
    return {
      ok: false,
      errorKey: 'boq-smart-builder-error-size',
      errorValues: { size: EXTENSION_TO_MAX_MB[ext] },
    };
  }

  return { ok: true, ext };
};

const SmartBoqBuilderModal = ({
  open = false,
  onClose = () => null,
  onGenerate = async () => null,
  packageName = '',
}) => {
  const inputRef = useRef(null);
  const sheetReadIdRef = useRef(0);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // 'select': dropzone (today's flow). 'confirm': work package + file + (optional) sheet picker.
  const [step, setStep] = useState('select');
  // null = not a spreadsheet / not yet known. [] / [names] once read.
  const [sheetNames, setSheetNames] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsError, setSheetsError] = useState(null);
  // Progress now lives on the BOQ items screen, not inside this modal

  const supportedFormatsText = useMemo(
    () => i18next.t('boq-smart-builder-supported-formats'),
    []
  );

  const hasPicker = Array.isArray(sheetNames) && sheetNames.length > 1;
  const allSelected = hasPicker && selectedSheets.length === sheetNames.length;

  const fileMetaText = useMemo(() => {
    if (!file) return '';
    if (hasPicker) {
      return i18next.t('boq-smart-builder-file-meta-sheets', {
        count: sheetNames.length,
      });
    }
    const ext = getExtension(file.name).toUpperCase();
    return ext ? `${ext} ${i18next.t('boq-smart-builder-file-meta-generic')}` : '';
  }, [file, hasPicker, sheetNames]);

  const reset = () => {
    sheetReadIdRef.current += 1;
    setFile(null);
    setError(null);
    setSubmitting(false);
    setStep('select');
    setSheetNames(null);
    setSelectedSheets([]);
    setSheetsError(null);
    setSheetsLoading(false);
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const chooseFile = () => {
    setError(null);
    inputRef.current?.click();
  };

  const setFileSafely = (nextFile) => {
    const validation = validateSingleFile(nextFile);
    if (!validation.ok) {
      setFile(null);
      setError(validation);
      return;
    }
    setFile(nextFile);
    setError(null);
    setSheetsError(null);
    setSelectedSheets([]);

    if (isSpreadsheetExtension(validation.ext)) {
      const readId = sheetReadIdRef.current;
      setStep('confirm');
      setSheetsLoading(true);
      setSheetNames(null);
      readWorkbookSheetNames(nextFile)
        .then((names) => {
          if (readId !== sheetReadIdRef.current) return;
          setSheetNames(names || []);
          setSheetsLoading(false);
        })
        .catch(() => {
          if (readId !== sheetReadIdRef.current) return;
          setSheetNames([]);
          setSheetsError('boq-smart-builder-error-sheets');
          setSheetsLoading(false);
        });
    } else {
      setSheetNames(null);
      setStep('confirm');
    }
  };

  const handleInputChange = (e) => {
    const nextFile = e?.target?.files?.[0] || null;
    setFileSafely(nextFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextFile = e?.dataTransfer?.files?.[0] || null;
    setFileSafely(nextFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChangeFile = () => {
    sheetReadIdRef.current += 1;
    setFile(null);
    setError(null);
    setSheetNames(null);
    setSelectedSheets([]);
    setSheetsError(null);
    setSheetsLoading(false);
    setStep('select');
    if (inputRef.current) {
      // reset <input/> so selecting same file again fires change
      inputRef.current.value = '';
    }
  };

  const toggleSheet = (name) => {
    setSelectedSheets((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleSelectAll = () => {
    setSelectedSheets(allSelected ? [] : sheetNames.slice());
  };

  const resolveSelectedSheetsForSubmit = () => {
    if (hasPicker) {
      return normalizeSelectedSheets(selectedSheets);
    }
    if (Array.isArray(sheetNames) && sheetNames.length === 1) {
      return normalizeSelectedSheets(sheetNames);
    }
    return [];
  };

  const handleGenerate = async () => {
    const validation = validateSingleFile(file);
    if (!validation.ok) {
      setError(validation);
      return;
    }
    const sheetsForSubmit = resolveSelectedSheetsForSubmit();
    if (hasPicker && sheetsForSubmit.length === 0) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onGenerate(file, sheetsForSubmit);
      handleClose();
    } catch (e) {
      setError({ ok: false, errorKey: 'boq-smart-builder-error-generic' });
    } finally {
      setSubmitting(false);
    }
  };

  const generateDisabled =
    submitting || sheetsLoading || (hasPicker && selectedSheets.length === 0);

  const sheetListMaxHeight = 240;

  const footerNote = (
    <Box
      sx={{
        mt: step === 'confirm' ? 1.25 : 2,
        p: 1.5,
        borderRadius: '8px',
        backgroundColor: aiEligibleBg || lightGreen || brightGray,
        border: `1px solid ${clinkGreen}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        flexShrink: 0,
      }}
    >
      <AutoAwesomeIcon sx={{ color: clinkGreen, mt: '2px', fontSize: 18 }} />
      <Typography sx={{ fontSize: '13px', color: black, opacity: 0.75, lineHeight: 1.45 }}>
        {i18next.t('boq-smart-builder-footer-note')}
      </Typography>
    </Box>
  );

  const workPackageBanner = packageName ? (
    <Box
      sx={{
        mb: 1.25,
        p: 1.25,
        borderRadius: '10px',
        backgroundColor: aiEligibleBg || lightGreen || brightGray,
        border: `1px solid ${clinkGreen}`,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        flexShrink: 0,
      }}
    >
      <Inventory2Icon sx={{ color: clinkGreen }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: clinkGreen,
          }}
        >
          {i18next.t('boq-smart-builder-work-package')}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: black,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {packageName}
        </Typography>
      </Box>
    </Box>
  ) : null;

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open
      onClose={handleClose}
      keepMounted={false}
      sx={{
        '& .MuiPaper-root': {
          borderRadius: '8px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
      maxWidth="sm"
      fullWidth={false}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${clinkLightPurple}`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: brightGray,
            }}
          >
            <AutoAwesomeIcon sx={{ color: clinkGreen, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: black }}>
              {i18next.t('boq-smart-builder-title')}
            </Typography>
            <Typography sx={{ fontSize: '13px', color: black, opacity: 0.6 }}>
              {i18next.t('boq-smart-builder-modal-subtitle')}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} aria-label="close" sx={{ p: 0.5 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: 2,
          pt: 2,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          '&.MuiDialogContent-root': {
            paddingTop: '16px',
          },
        }}
      >
        {workPackageBanner}

        {step === 'select' && (
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={chooseFile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                chooseFile();
              }
            }}
            sx={{
              border: `2px dashed rgba(0,0,0,0.15)`,
              borderRadius: '8px',
              minHeight: '300px',
              backgroundColor: white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              textAlign: 'center',
              cursor: 'pointer',
              p: 2,
              flexShrink: 0,
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, opacity: 0.6, mb: 1 }} />
            <Typography sx={{ fontSize: '15px', color: black }}>
              {i18next.t('boq-smart-builder-drop-title')}
            </Typography>
            <Typography sx={{ fontSize: '13px', color: black, opacity: 0.6 }}>
              {i18next.t('boq-smart-builder-drop-subtitle')}
            </Typography>
            <Typography sx={{ fontSize: '13px', color: clinkRed, mt: 1 }}>
              {i18next.t('boq-smart-builder-single-file')}
            </Typography>
            <Button
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                chooseFile();
              }}
              sx={{
                mt: 2,
                textTransform: 'none',
                borderColor: `rgba(0,0,0,0.2)`,
                color: black,
                '&:hover': { borderColor: `rgba(0,0,0,0.3)` },
              }}
            >
              {i18next.t('boq-smart-builder-browse-files')}
            </Button>
            <Typography sx={{ fontSize: '13px', color: black, opacity: 0.6, mt: 1 }}>
              {supportedFormatsText}
            </Typography>
          </Box>
        )}

        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleInputChange}
          accept=".pdf,.xlsx,.xls,.csv,.txt"
        />

        {step === 'confirm' && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: 1.25,
                border: `1px solid ${clinkLightPurple}`,
                borderRadius: '8px',
                flexShrink: 0,
              }}
            >
              <InsertDriveFileIcon sx={{ color: black, opacity: 0.5 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: black,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file?.name}
                </Typography>
                {fileMetaText && (
                  <Typography sx={{ fontSize: '12px', color: black, opacity: 0.6 }}>
                    {fileMetaText}
                  </Typography>
                )}
              </Box>
              <Button
                onClick={handleChangeFile}
                sx={{
                  textTransform: 'none',
                  color: clinkGreen,
                  fontWeight: 600,
                  fontSize: '13px',
                  flex: '0 0 auto',
                }}
              >
                {i18next.t('boq-smart-builder-change-file')}
              </Button>
            </Box>

            {sheetsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, flexShrink: 0 }}>
                <CircularProgress size={20} />
              </Box>
            )}

            {sheetsError && (
              <Typography sx={{ fontSize: '13px', color: clinkRed, mt: 1, flexShrink: 0 }}>
                {i18next.t(sheetsError)}
              </Typography>
            )}

            {hasPicker && !sheetsLoading && (
              <>
                <Typography
                  sx={{
                    fontSize: '13px',
                    color: black,
                    opacity: 0.75,
                    mt: 1.25,
                    mb: 0.75,
                    lineHeight: 1.45,
                    flexShrink: 0,
                  }}
                >
                  {i18next.t('boq-smart-builder-sheets-explainer')}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.75,
                    flexShrink: 0,
                  }}
                >
                  <Button
                    onClick={toggleSelectAll}
                    sx={{
                      textTransform: 'none',
                      color: clinkGreen,
                      fontWeight: 600,
                      fontSize: '13px',
                      p: 0,
                      minWidth: 0,
                    }}
                  >
                    {i18next.t(
                      allSelected
                        ? 'boq-smart-builder-clear-all'
                        : 'boq-smart-builder-select-all'
                    )}
                  </Button>
                  <Typography sx={{ fontSize: '13px', color: black, opacity: 0.6 }}>
                    {i18next.t('boq-smart-builder-sheets-count', {
                      count: selectedSheets.length,
                      total: sheetNames.length,
                    })}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: `1px solid ${clinkLightPurple}`,
                    borderRadius: '8px',
                    flex: 1,
                    minHeight: 0,
                    maxHeight: sheetListMaxHeight,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <FormGroup sx={{ py: 0.25 }}>
                    {sheetNames.map((name) => {
                      const isSelected = selectedSheets.includes(name);
                      return (
                      <FormControlLabel
                        key={name}
                        sx={{
                          mx: 0,
                          px: 1.25,
                          py: 0.375,
                          borderBottom: `1px solid ${clinkLightPurple}`,
                          backgroundColor: isSelected
                            ? aiEligibleBg || lightGreen || brightGray
                            : 'transparent',
                          '&:last-of-type': { borderBottom: 'none' },
                        }}
                        control={
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSheet(name)}
                            sx={{
                              color: clinkGreen,
                              '&.Mui-checked': { color: clinkGreen },
                            }}
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: '14px', color: black }}>
                            {name}
                          </Typography>
                        }
                      />
                      );
                    })}
                  </FormGroup>
                </Box>
              </>
            )}
          </Box>
        )}

        {error?.errorKey && (
          <Typography sx={{ fontSize: '13px', color: clinkRed, mt: 1, flexShrink: 0 }}>
            {i18next.t(error.errorKey, error.errorValues || {})}
          </Typography>
        )}

        {footerNote}

      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'flex-end',
          gap: 1,
          px: 2,
          py: 1.25,
          borderTop: `1px solid ${clinkLightPurple}`,
          flexShrink: 0,
          backgroundColor: white,
        }}
      >
        {step === 'confirm' && hasPicker && !sheetsLoading && (
          <Typography
            sx={{
              fontSize: '13px',
              color: selectedSheets.length ? clinkGreen : black,
              opacity: selectedSheets.length ? 1 : 0.6,
              flex: 1,
              minWidth: 0,
            }}
          >
            {selectedSheets.length
              ? i18next.t('boq-smart-builder-sheets-footer-selected', {
                  count: selectedSheets.length,
                })
              : i18next.t('boq-smart-builder-sheets-footer-empty')}
          </Typography>
        )}
        <Button
          onClick={handleClose}
          sx={{ textTransform: 'none', color: black }}
          disabled={submitting}
        >
          {i18next.t('cancel')}
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          startIcon={
            submitting ? <CircularProgress size={16} sx={{ color: white }} /> : <AutoAwesomeIcon />
          }
          disabled={generateDisabled}
          sx={{
            textTransform: 'none',
            backgroundColor: clinkGreen,
            color: white,
            '&:hover': { backgroundColor: clinkGreen },
          }}
        >
          {i18next.t('boq-smart-builder-generate-boq')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SmartBoqBuilderModal;
