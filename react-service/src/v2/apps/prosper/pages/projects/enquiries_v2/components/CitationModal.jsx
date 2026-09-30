import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import MenuIcon from '@mui/icons-material/Menu';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { pdfjs, Document, Page } from 'react-pdf';
import { useTranslation } from 'react-i18next';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const THUMBNAIL_SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'];
const THUMBNAIL_PREVIEW_HEIGHT = 240;

const CitationModal = ({ open, onClose, document, citation, isAddendum }) => {
    const { t } = useTranslation();

    const pdfViewportRef = useRef(null);
    const [numPages, setNumPages] = useState(null);
    const [scale, setScale] = useState(1.2);
    const [pageSizes, setPageSizes] = useState({});
    const [textMatches, setTextMatches] = useState([]);
    const [pdfDocument, setPdfDocument] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [error, setError] = useState(null);
    const [thumbnailsOpen, setThumbnailsOpen] = useState(true);

    const [pageInput, setPageInput] = useState('1');

    const onDocumentLoadSuccess = useCallback(({ numPages: totalPages }) => {
        setNumPages(totalPages);
        setError(null);
        if (citation?.pages?.[0]) {
            setPageNumber(citation?.pages?.[0]);
        }
    }, [citation?.pages]);

    const onDocumentLoadError = useCallback((err) => {
        setError(err?.Error || 'Failed to load PDF');
    }, []);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    const handlePrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
    const handleFirstPage = () => setPageNumber(1);
    const handleLastPage = () => setPageNumber(numPages || 1);

    const citedPages = useMemo(() => {
        const raw = Array.isArray(citation?.pages) ? citation.pages : [];
        const unique = Array.from(new Set(raw));
        const filtered = unique.filter((p) => {
            if (!Number.isInteger(p)) return false;
            if (p < 1) return false;
            if (numPages && p > numPages) return false;
            return true;
        });
        filtered.sort((a, b) => a - b);
        return filtered;
    }, [citation?.pages, numPages]);

    const applyFit = useCallback((mode) => {
        const container = pdfViewportRef.current;
        const size = pageSizes[pageNumber];
        if (!container || !size?.width || !size?.height) return;

        const containerWidth = container.clientWidth - 32; // account for padding-ish
        const containerHeight = container.clientHeight - 32;
        const pageWidth = size.width;
        const pageHeight = size.height;

        if (mode === 'width') {
            setScale(Math.max(0.5, Math.min(containerWidth / pageWidth, 3)));
            return;
        }

        // mode === 'page'
        const fitScale = Math.min(containerWidth / pageWidth, containerHeight / pageHeight);
        setScale(Math.max(0.5, Math.min(fitScale, 3)));
    }, [pageNumber, pageSizes]);

    const commitPageInput = useCallback((rawValue) => {
        const n = Number(rawValue);
        if (!Number.isFinite(n)) {
            setPageInput(String(pageNumber));
            return;
        }

        const max = numPages || 1;
        const next = Math.min(Math.max(Math.trunc(n), 1), max);
        setPageNumber(next);
        setPageInput(String(next));
    }, [numPages, pageNumber]);

    const searchText = citation?.text;

    const customTextRenderer = useMemo(() => {
        if (!searchText) return undefined;

        const normalizedSearchText = searchText.toLowerCase().trim();

        return (textItem) => {
            const text = textItem.str;
            const lowerText = text.toLowerCase().trim();

            if (lowerText === normalizedSearchText) {
                return (
                    <span
                        style={{
                            backgroundColor: 'rgba(255, 235, 59, 0.6)',
                            border: '1px solid rgba(255, 193, 7, 0.8)',
                            borderRadius: '2px',
                            padding: '2px 0',
                        }}
                    >
                        {text}
                    </span>
                );
            }

            return text;
        };
    }, [searchText]);

    useEffect(() => {
        const citationInfo = citation;

        if (!pdfDocument || !citationInfo || !citationInfo.text) return;

        const searchPdfText = async () => {
            const searchString = citationInfo.text.toLowerCase().trim();
            const pages = citationInfo.pages || [];

            const pagePromises = pages.map(async (pageNum) => {
                try {
                    const page = await pdfDocument.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const viewport = page.getViewport({ scale: 1 });

                    const validItems = textContent.items.filter(item => item.str.trim().length > 0 && item.height > 0);

                    let fullText = '';
                    const textItems = [];

                    validItems.forEach((item) => {
                        const startIndex = fullText.length;
                        fullText += item.str + ' ';
                        textItems.push({
                            text: item.str,
                            startIndex,
                            endIndex: startIndex + item.str.length,
                            x: item.transform[4],
                            y: item.transform[5],
                            width: item.width,
                            height: item.height,
                        });
                    });

                    const normalizedSearchString = searchString.replace(/\s+/g, ' ').trim();
                    const normalizedFullText = fullText.toLowerCase().replace(/\s+/g, ' ');

                    const searchIndex = normalizedFullText.indexOf(normalizedSearchString);

                    if (searchIndex !== -1) {
                        const searchEndIndex = searchIndex + normalizedSearchString.length;
                        const matchedItems = [];

                        textItems.forEach((item) => {
                            if (item.endIndex > searchIndex && item.startIndex < searchEndIndex) {
                                const y = viewport.height - item.y;
                                matchedItems.push({
                                    x: item.x,
                                    y: y - item.height,
                                    width: item.width,
                                    height: item.height,
                                    text: item.text
                                });
                            }
                        });


                        if (matchedItems.length > 0) {
                            return {
                                page: pageNum,
                                text: citationInfo.text,
                                items: matchedItems,
                            };
                        }
                    }
                } catch (er) {
                    return null;
                }
                return null;
            });

            const results = await Promise.all(pagePromises);
            const validMatches = results.filter(match => match !== null);
            setTextMatches(validMatches);
        };

        searchPdfText();
    }, [pdfDocument, citation]);

    // Keep page input in sync with actual page.
    useEffect(() => {
        setPageInput(String(pageNumber));
    }, [pageNumber]);

    // Reset viewer state when a new document is opened.
    useEffect(() => {
        if (!open) return;
        setNumPages(null);
        setPdfDocument(null);
        setTextMatches([]);
        setPageSizes({});
        setError(null);
        setScale(1.2);
        setPageNumber(citation?.pages?.[0] || 1);
    }, [open, document?.url]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            data-testid="citation-modal"
            PaperProps={{
                sx: {
                    height: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <DialogTitle sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Typography variant="h6" component="div">
                        {t(isAddendum ? 'Tender Addendum' : 'Tender Document')}
                    </Typography>
                    {isAddendum && (
                        <Chip
                            label={t('Addendum')}
                            size="small"
                            variant="filled"
                            color="info"
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

                    <TextField
                        value={pageInput}
                        onChange={(e) => {
                            const raw = e.target.value;
                            // allow empty while typing; restrict to digits otherwise
                            if (raw === '' || /^\d+$/.test(raw)) {
                                setPageInput(raw);
                            }
                        }}
                        onBlur={() => commitPageInput(pageInput)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                commitPageInput(pageInput);
                                e.currentTarget.blur();
                            }
                        }}
                        size="small"
                        sx={{
                            width: 76,
                            '& .MuiInputBase-input': {
                                textAlign: 'center',
                                px: 1,
                            },
                        }}
                        InputProps={{
                            inputProps: { inputMode: 'numeric', 'aria-label': t('Page number') },
                            sx: {
                                '& .MuiInputAdornment-root': {
                                    ml: 0,
                                },
                            },
                            endAdornment: (
                                <InputAdornment position="end" sx={{ ml: 0, mr: 0.25 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 0 }}>
                                        /{numPages || '-'}
                                    </Typography>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Tooltip title={t('First page')}>
                        <span>
                            <IconButton onClick={handleFirstPage} disabled={pageNumber <= 1} size="small">
                                <FirstPageIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t('Previous page')}>
                        <span>
                            <IconButton onClick={handlePrevPage} disabled={pageNumber <= 1} size="small">
                                <NavigateBeforeIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t('Next page')}>
                        <span>
                            <IconButton onClick={handleNextPage} disabled={numPages ? pageNumber >= numPages : true} size="small">
                                <NavigateNextIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t('Last page')}>
                        <span>
                            <IconButton onClick={handleLastPage} disabled={numPages ? pageNumber >= numPages : true} size="small">
                                <LastPageIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

                    <Tooltip title={t('Zoom out')}>
                        <IconButton onClick={handleZoomOut} size="small">
                            <ZoomOutIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ minWidth: 48, textAlign: 'center' }}>{Math.round(scale * 100)}%</Typography>
                    <Tooltip title={t('Zoom in')}>
                        <IconButton onClick={handleZoomIn} size="small">
                            <ZoomInIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Fit to width')}>
                        <IconButton onClick={() => applyFit('width')} size="small">
                            <AspectRatioIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Fit to page')}>
                        <IconButton onClick={() => applyFit('page')} size="small">
                            <FitScreenIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <IconButton onClick={onClose} edge="end" size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, bgcolor: 'grey.100', display: 'flex', overflow: 'hidden' }}>
                {thumbnailsOpen && (
                    <Box
                        sx={{
                            width: 240,
                            borderRight: 1,
                            borderColor: 'divider',
                            bgcolor: 'grey.100',
                            overflow: 'auto',
                            p: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, pb: 1 }}>
                            <Tooltip title={t('Hide thumbnails')}>
                                <IconButton
                                    onClick={() => setThumbnailsOpen(false)}
                                    size="small"
                                    sx={{
                                        color: 'text.primary',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <MenuIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {citedPages.length > 0 ? t('Cited pages') : t('Pages')}
                            </Typography>
                        </Box>
                        <Document
                            file={document?.url}
                            loading={
                                <Box sx={{ p: 1 }}>
                                    {THUMBNAIL_SKELETON_KEYS.map((k) => (
                                        <Box key={`thumb-skel-${k}`} sx={{ px: 1, py: 0.75, mb: 0.75 }}>
                                            <Skeleton
                                                variant="rectangular"
                                                width={220}
                                                height={THUMBNAIL_PREVIEW_HEIGHT}
                                                sx={{ borderRadius: 1 }}
                                            />
                                            <Skeleton variant="text" sx={{ mt: 0.5 }} />
                                        </Box>
                                    ))}
                                </Box>
                            }
                            error={<Typography variant="body2" sx={{ color: 'error.main', p: 2 }}>{t('Error loading PDF')}</Typography>}
                        >
                            {(citedPages.length > 0 ? citedPages : Array.from(new Array(numPages || 0), (el, idx) => idx + 1)).map((p) => {
                                const isActive = p === pageNumber;
                                return (
                                    <Box
                                        key={`thumb-${p}`}
                                        onClick={() => setPageNumber(p)}
                                        sx={{
                                            cursor: 'pointer',
                                            borderRadius: 1,
                                            border: isActive ? '2px solid #6ea8ff' : '1px solid rgba(0,0,0,0.12)',
                                            bgcolor: '#fff',
                                            boxShadow: isActive ? '0 0 0 1px rgba(110,168,255,0.22), 0 6px 18px rgba(17, 24, 39, 0.10)' : 'none',
                                            position: 'relative',
                                            transition: 'border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease, background-color 120ms ease',
                                            '&:hover': {
                                                bgcolor: 'grey.50',
                                            },
                                            transform: isActive ? 'translateY(-1px)' : 'none',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                height: THUMBNAIL_PREVIEW_HEIGHT,
                                                overflow: 'hidden',
                                                borderRadius: 1,
                                                bgcolor: 'grey.50',
                                            }}
                                        >
                                        <Page
                                            pageNumber={p}
                                            width={200}
                                            renderAnnotationLayer={false}
                                            renderTextLayer={false}
                                            loading={
                                                <Skeleton
                                                    variant="rectangular"
                                                    width={220}
                                                    height={THUMBNAIL_PREVIEW_HEIGHT}
                                                    sx={{ borderRadius: 1 }}
                                                />
                                            }
                                        />
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                textAlign: 'center',
                                                mt: 0.6,
                                                color: 'text.secondary',
                                                fontWeight: isActive ? 700 : 600,
                                            }}
                                        >
                                            {p}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Document>
                    </Box>
                )}

                <Box
                    ref={pdfViewportRef}
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        px: 1,
                        pt: 1,
                        pb: 0,
                        position: 'relative',
                    }}
                >
                    {!thumbnailsOpen && (
                        <Tooltip title={t('Show thumbnails')}>
                            <IconButton
                                onClick={() => setThumbnailsOpen(true)}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    left: 8,
                                    top: 8,
                                    bgcolor: 'background.paper',
                                    color: 'text.primary',
                                    border: 1,
                                    borderColor: 'divider',
                                    boxShadow: 2,
                                    '&:hover': { bgcolor: 'action.hover' },
                                    zIndex: 2,
                                }}
                            >
                                <MenuIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Box sx={{ position: 'relative' }}>
                        <Document
                            file={document?.url}
                            onLoadSuccess={(pdf) => {
                                onDocumentLoadSuccess(pdf);
                                setPdfDocument(pdf);
                            }}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <Box sx={{ p: 4, width: 720, maxWidth: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <CircularProgress size={20} />
                                        <Typography variant="body2" color="text.secondary">
                                            {t('Loading document')}
                                        </Typography>
                                    </Box>
                                    <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 1 }} />
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                        <Skeleton variant="rounded" width={120} height={28} />
                                        <Skeleton variant="rounded" width={160} height={28} />
                                        <Skeleton variant="rounded" width={90} height={28} />
                                    </Box>
                                </Box>
                            }
                            error={
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: 'error.main' }}>
                                    <Typography>{error || t('Error loading PDF')}</Typography>
                                </Box>
                            }
                        >
                            {numPages && (
                                <Box
                                    sx={{
                                        position: 'relative',
                                        width: pageSizes[pageNumber]?.width ? `${pageSizes[pageNumber].width * scale}px` : 'auto',
                                        height: pageSizes[pageNumber]?.height ? `${pageSizes[pageNumber].height * scale}px` : 'auto',
                                        margin: '0 auto',
                                        display: 'inline-block',
                                        bgcolor: '#fff',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        boxShadow: 3,
                                    }}
                                >
                                    <Page
                                        onLoadError={onDocumentLoadError}
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        renderAnnotationLayer={false}
                                        renderTextLayer={false}
                                        customTextRenderer={customTextRenderer}
                                        loading={
                                            <Box sx={{ p: 2 }}>
                                                <Skeleton
                                                    variant="rectangular"
                                                    height={560}
                                                    sx={{ borderRadius: 1, width: 720, maxWidth: '100%' }}
                                                />
                                            </Box>
                                        }
                                        onLoadSuccess={(page) => {
                                            const viewport = page.getViewport({ scale: 1 });
                                            setPageSizes((prev) => ({
                                                ...prev,
                                                [pageNumber]: {
                                                    width: viewport.width,
                                                    height: viewport.height,
                                                },
                                            }));
                                        }}
                                    />

                                    {/* Citation overlays */}
                                    {textMatches
                                        .filter((match) => match.page === pageNumber)
                                        .map((match, matchIdx) => (
                                            <React.Fragment key={`citation-${match.page}-${match.items[0]?.x}-${match.items[0]?.y}`}>
                                                {/* Render individual highlight boxes for each matched text item */}
                                                {match.items.map((item) => (
                                                    <Box
                                                        key={`highlight-${match.page}-${item.x}-${item.y}-${item.width}`}
                                                        sx={{
                                                            position: 'absolute',
                                                            left: `${item.x * scale}px`,
                                                            top: `${item.y * scale}px`,
                                                            width: `${item.width * scale}px`,
                                                            height: `${item.height * scale}px`,
                                                            backgroundColor: 'rgba(255, 235, 59, 0.4)',
                                                            border: '2px solid rgba(255, 193, 7, 0.8)',
                                                            borderRadius: '4px',
                                                            pointerEvents: 'none',
                                                            zIndex: 9,
                                                        }}
                                                    />
                                                ))}

                                                {/* Citation marker with tooltip - positioned at first matched item */}
                                                <Tooltip
                                                    title={match.text}
                                                    arrow
                                                    placement="top"
                                                >
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            left: `${match.items[0].x * scale - 12}px`,
                                                            top: `${match.items[0].y * scale - 12}px`,
                                                            width: 24,
                                                            height: 24,
                                                            bgcolor: 'primary.main',
                                                            color: '#fff',
                                                            fontSize: 13,
                                                            fontWeight: 'bold',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            boxShadow: 3,
                                                            zIndex: 10,
                                                            border: '2px solid white',
                                                            transition: 'transform 0.2s',
                                                            '&:hover': {
                                                                transform: 'scale(1.15)',
                                                                boxShadow: 4,
                                                            },
                                                        }}
                                                    >
                                                        {matchIdx + 1}
                                                    </Box>
                                                </Tooltip>
                                            </React.Fragment>
                                        ))}
                                </Box>
                            )}
                        </Document>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

CitationModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    document: PropTypes.shape({
        url: PropTypes.string.isRequired,
        name: PropTypes.string,
    }),
    citation: PropTypes.shape({
        pages: PropTypes.arrayOf(PropTypes.number),
        text: PropTypes.string,
    }),
    isAddendum: PropTypes.bool,
};

export default CitationModal;
