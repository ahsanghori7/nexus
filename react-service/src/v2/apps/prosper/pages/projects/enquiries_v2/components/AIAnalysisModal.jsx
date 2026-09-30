import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import Alert from '@mui/material/Alert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import { CONSTANTS } from 'clink-components';
import InsightSection from './InsightSection';
import {
    fetchTenderInsights,
    createTenderInsights,
} from 'v2/store/reducers/prosper/tender-insights';
import CitationModal from './CitationModal';
import { goToNewTab, getUrl } from 'v2/helpers/url';
import moment from 'moment';

const { prosperPurple, prosperWarningLight, prosperWarningMain, prosperWarningDark } = CONSTANTS.colors.prosper;

const isCitationFromAddendum = (citation = {}) => {
    if (!citation || typeof citation !== 'object') return false;

    if (citation.is_addendum === true || citation.isAddendum === true) {
        return true;
    }

    const sourceType = String(citation?.source_type || citation?.sourceType || citation?.document_type || citation?.documentType || '').toLowerCase();
    if (sourceType === 'addendum' || sourceType === 'tender_addendum') {
        return true;
    }

    return /addendum/i.test(String(citation.document || ''));
};

const removeInlineParam = (rawUrl) => {
    if (!rawUrl) return rawUrl;

    const raw = String(rawUrl);

    try {
        const base = typeof window !== 'undefined' && window?.location?.origin ? window.location.origin : 'http://localhost';
        const url = new URL(raw, base);
        url.searchParams.delete('inline');
        return url.toString();
    } catch (e) {
        return raw
            .replace(/[?&]inline=true\b/i, (match) => (match.startsWith('?') ? '?' : ''))
            .replace(/\?&/, '?')
            .replace(/\?$/, '');
    }
};

const normalizeFilesMapToList = (files) => {
    if (!files || typeof files !== 'object') return [];

    return Object.entries(files)
        .map(([id, meta]) => {
            if (!meta || typeof meta !== 'object') return null;
            return {
                id: String(id),
                fileName: meta.file_name || '',
                fileUrl: meta.file_url || '',
            };
        })
        .filter(Boolean);
};

const AIAnalysisModal = ({
    open,
    onClose,
    tenderId,
    projectName,
    tenderInsights,
    dispatch,
    enquiry
}) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const pollingIntervalRef = useRef(null);
    const [citationModalOpen, setCitationModalOpen] = useState(false);
    const [selectedCitation, setSelectedCitation] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [selectedCitationIsAddendum, setSelectedCitationIsAddendum] = useState(false);
    const [downloadMenuAnchorEl, setDownloadMenuAnchorEl] = useState(null);
    const insightData = tenderInsights?.insights?.[tenderId];
    const status = insightData?.status || 'idle';
    const error = insightData?.error;
    const data = insightData?.data;
    const files = insightData?.files || null;
    const timestamp = insightData?.timestamp;
    const downloadDocuments = normalizeFilesMapToList(files);
    const downloadMenuOpen = Boolean(downloadMenuAnchorEl);

    const hasValidInsights = React.useCallback(() => {
        if (!data) return false;
        const sections = [
            data.headline_dates,
            data.payment_terms,
            data.contractual_risks,
            data.warnings_notes,
            data.insurances,
            data.scope_attendances,
            data.dayworks,
            data.health_safety_site_rules,
            data.tender_submission_requirements,
            data.scope_of_works,
        ];
        return sections.some(section => {
            if (!section) return false;
            return typeof section === 'object' && Object.keys(section).length > 0;
        });
    }, [data]);

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const startPolling = () => {
        stopPolling();
        pollingIntervalRef.current = setInterval(() => {
            if (tenderId) {
                dispatch(fetchTenderInsights({ tenderId }));
            }
        }, 5000);
    };

    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, []);

    useEffect(() => {
        if (open && tenderId) {
            const currentInsightData = tenderInsights?.insights?.[tenderId];

            if (!currentInsightData || currentInsightData.status === 'idle') {
                dispatch(fetchTenderInsights({ tenderId }));
            }
            else if (currentInsightData.status === 'PENDING' || currentInsightData.status === 'STARTED') {
                startPolling();
            } else {
                stopPolling();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, tenderId, dispatch, tenderInsights]);


    const handleRetry = () => {
        stopPolling();
        dispatch(createTenderInsights({ tenderId }));
    };

    const handleDownloadMenuOpen = (event) => {
        setDownloadMenuAnchorEl(event.currentTarget);
    };

    const handleDownloadMenuClose = () => {
        setDownloadMenuAnchorEl(null);
    };

    const handleDownloadSingle = (url) => {
        if (!url) return;
        goToNewTab(removeInlineParam(url));
    };

    const handleCitationClick = (item) => {
        if (!item.citation) return;

        const documentId = enquiry?.id;
        const fileId = item?.citation?.file_id;

        let documentUrl = null;
        let documentName = null;

        if (fileId && files) {
            const fileKey = String(fileId);
            const fileFromMap = files[fileKey] || files[fileId];

            if (fileFromMap?.file_url) {
                documentUrl = fileFromMap.file_url;
            }

            if(fileFromMap?.file_name) {
                documentName = fileFromMap.file_name;
            }
        }

        if (!documentUrl && documentId) {
            documentUrl = getUrl(
                'APP_PROSPER',
                `/relay/v1/document/${documentId}/download?inline=true`,
            );
            documentName = item?.citation?.document || ''
        }

        if (!documentUrl) {
            return;
        }

        setSelectedCitation(item?.citation);
        setSelectedDocument({
            url: documentUrl,
            name: documentName,
        });
        setSelectedCitationIsAddendum(isCitationFromAddendum(item?.citation));
        setCitationModalOpen(true);
    };


    const convertObjectToItems = (obj) => {
        if (!obj || typeof obj !== 'object') return [];
        return Object.entries(obj).map(([key, value]) => ({
            label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            value: value?.value || value?.text || JSON.stringify(value),
            pageReference: value?.citation?.pages ? value.citation.pages.join(', ') : null,
            pageReferences: value?.citation?.pages || null,
            citation: value?.citation || null,
        }));
    };

    const getSections = () => {
        if (!data) return [];

        return [
            {
                title: t('ai-section-key-dates'),
                fieldsAnalyzed: data.headline_dates ? Object.keys(data.headline_dates).length : 0,
                items: convertObjectToItems(data.headline_dates),
                defaultExpanded: true,
            },
            {
                title: t('ai-section-payment-terms'),
                fieldsAnalyzed: data.payment_terms ? Object.keys(data.payment_terms).length : 0,
                items: convertObjectToItems(data.payment_terms),
            },
            {
                title: t('ai-section-contractual-risks'),
                fieldsAnalyzed: data.contractual_risks ? Object.keys(data.contractual_risks).length : 0,
                items: convertObjectToItems(data.contractual_risks),
            },
            {
                title: t('ai-section-warnings-notes'),
                fieldsAnalyzed: data.warnings_notes ? Object.keys(data.warnings_notes).length : 0,
                items: convertObjectToItems(data.warnings_notes),
            },
            {
                title: t('ai-section-insurance-requirements'),
                fieldsAnalyzed: data.insurances ? Object.keys(data.insurances).length : 0,
                items: convertObjectToItems(data.insurances),
            },
            {
                title: t('ai-section-scope-attendances'),
                fieldsAnalyzed: data.scope_attendances ? Object.keys(data.scope_attendances).length : 0,
                items: convertObjectToItems(data.scope_attendances),
            },
            {
                title: t('ai-section-dayworks'),
                fieldsAnalyzed: data.dayworks ? Object.keys(data.dayworks).length : 0,
                items: convertObjectToItems(data.dayworks),
            },
            {
                title: t('ai-section-health-safety'),
                fieldsAnalyzed: data.health_safety_site_rules ? Object.keys(data.health_safety_site_rules).length : 0,
                items: convertObjectToItems(data.health_safety_site_rules),
            },
            {
                title: t('ai-section-submission-requirements'),
                fieldsAnalyzed: data.tender_submission_requirements ? Object.keys(data.tender_submission_requirements).length : 0,
                items: convertObjectToItems(data.tender_submission_requirements),
            },
        ];
    };

    const sections = getSections();
    const isLoading = status === 'loading' || status === 'creating' || status === 'PENDING' || status === 'STARTED';
    const hasError = status === 'error' || (status === 'success' && data && !hasValidInsights());
    const hasData = status === 'success' && data && hasValidInsights();
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            data-testid="ai-analysis-modal"
            PaperProps={{
                sx: {
                    maxHeight: '90vh',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    paddingBottom: '12px',
                    paddingTop: '20px',
                    paddingX: '24px',
                }}
            >
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('ai-tender-insights')}
                    </Typography>
                    {projectName && (
                        <Typography variant="body2" sx={{ color: prosperPurple, marginTop: '4px' }}>
                            {projectName}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {hasData && (
                        <Button
                            onClick={handleDownloadMenuOpen}
                            startIcon={<DownloadIcon />}
                            variant="outlined"
                            size="meduim"
                            sx={{
                                textTransform: 'none',
                            }}
                            aria-haspopup="menu"
                            aria-expanded={downloadMenuOpen ? 'true' : undefined}
                            data-testid="download-button"
                        >
                            {t('text-download-tender-document')}
                        </Button>
                    )}
                    <Menu
                        anchorEl={downloadMenuAnchorEl}
                        open={downloadMenuOpen}
                        onClose={handleDownloadMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        {downloadDocuments.map((doc) => (
                            <MenuItem
                                key={doc.id}
                                onClick={() => {
                                    handleDownloadSingle(doc.fileUrl);
                                    handleDownloadMenuClose();
                                }}
                                data-testid={`download-document-${doc.id}`}
                            >
                                <ListItemText primary={doc.fileName || t('Document')} />
                            </MenuItem>
                        ))}
                        {downloadDocuments.length === 0 && enquiry?.id && (
                            <MenuItem
                                onClick={() => {
                                    goToNewTab(`/relay/v1/document/${enquiry.id}/download`);
                                    handleDownloadMenuClose();
                                }}
                                data-testid="download-legacy-document"
                            >
                                <ListItemText primary={t('Download tender document')} />
                            </MenuItem>
                        )}
                    </Menu>
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{ color: theme.palette.text.secondary }}
                        data-testid="close-button"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ padding: 0, overflowY: 'auto' }}>
                {/* Loading State */}
                {isLoading && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '48px 16px',
                        }}
                    >
                        <CircularProgress
                            size={48}
                            sx={{ color: prosperPurple, marginBottom: '16px' }}
                        />
                        <Typography variant="h6" sx={{ marginBottom: '8px' }}>
                            {t('ai-loading-generating')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                            {t('ai-loading-wait')}
                        </Typography>
                    </Box>
                )}

                {/* Error State */}
                {hasError && (
                    <Box sx={{ padding: '24px' }}>
                        <Alert
                            severity="error"
                            sx={{ marginBottom: '16px' }}
                            action={
                                <Button color="inherit" size="small" onClick={handleRetry}>
                                    {t('text-retry')}
                                </Button>
                            }
                        >
                            {status === 'success' && data && !hasValidInsights()
                                ? t('ai-error-no-insights')
                                : error || t('ai-error-failed-generate')}
                        </Alert>
                    </Box>
                )}

                {/* Success State */}
                {hasData && (
                    <Box>
                        {/* Timestamp and Disclaimer */}
                        <Box sx={{ padding: '15px' }}>
                            <Typography variant="body2" sx={{ display: 'block', marginBottom: '12px', paddingLeft: "2px", color: theme.palette.text.primary }}>
                                {t('ai-generated-on')} {timestamp ? moment(timestamp).format("DD/MM/YYYY HH:mm") : ''}
                            </Typography>
                            <Box
                                sx={{
                                    backgroundColor: prosperWarningLight,
                                    border: `1px solid ${prosperWarningMain}`,
                                    borderRadius: '4px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: prosperWarningDark,
                                        fontWeight: 500,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <strong>{t('ai-disclaimer-label')}</strong> {t('ai-disclaimer-text')}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Accordion Sections */}
                        <Box sx={{ padding: '15px' }}>
                            {sections.map((section) => (
                                <InsightSection
                                    key={section.title}
                                    title={section.title}
                                    fieldsAnalyzed={section.fieldsAnalyzed}
                                    items={section.items}
                                    defaultExpanded={section.defaultExpanded}
                                    onCitationClick={handleCitationClick}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
                <CitationModal
                    open={citationModalOpen}
                    onClose={() => {
                        setCitationModalOpen(false);
                        setSelectedCitationIsAddendum(false);
                    }}
                    citation={selectedCitation}
                    document={selectedDocument}
                    isAddendum={selectedCitationIsAddendum}
                />
            </DialogContent>
        </Dialog>
    );
};

AIAnalysisModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    tenderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    projectName: PropTypes.string,
    tenderInsights: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    enquiry: PropTypes.object,
};

const mapStateToProps = (state) => ({
    tenderInsights: state.tenderInsights,
});

export default connect(mapStateToProps)(AIAnalysisModal);
