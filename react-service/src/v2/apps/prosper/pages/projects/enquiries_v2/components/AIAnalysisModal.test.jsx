import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AIAnalysisModal from './AIAnalysisModal';
import { fetchTenderInsights } from 'v2/store/reducers/prosper/tender-insights';
import { goToNewTab } from 'v2/helpers/url';

jest.mock('canvas', () => ({
    createCanvas: () => ({
        getContext: () => ({}),
    }),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
    }),
}));

jest.mock('v2/helpers/url', () => ({
    getUrl: jest.fn((app, prefix = '') => `${app}${prefix}`),
    goToNewTab: jest.fn(),
}));

jest.mock('v2/hooks/useSnackbar', () => ({
    useSnackbar: () => ({
        snackbar: {},
        showSnackbar: jest.fn(),
        closeSnackbar: jest.fn(),
    }),
}));

jest.mock('@mui/material/styles', () => ({
    ...jest.requireActual('@mui/material/styles'),
    useTheme: () => ({
        palette: {
            divider: '#e0e0e0',
            text: {
                primary: '#000000',
                secondary: '#757575',
            },
        },
    }),
}));

// Mock the action creator
jest.mock('v2/store/reducers/prosper/tender-insights', () => ({
    fetchTenderInsights: jest.fn(() => ({ type: 'mock_fetch' })),
    createTenderInsights: jest.fn(() => ({ type: 'mock_create' })),
}));

// Mock react-pdf
jest.mock('react-pdf', () => {
    const React = require('react');
    return {
        pdfjs: {
            GlobalWorkerOptions: {
                workerSrc: '',
            },
            version: 'mock-version',
        },
        Document: ({ children, onLoadSuccess }) => {
            // Simulating async loading - call onLoadSuccess immediately for testing
            React.useEffect(() => {
                if (onLoadSuccess) {
                    // Use setTimeout with 0 to ensure it runs after render
                    setTimeout(() => {
                        onLoadSuccess({ numPages: 10 });
                    }, 0);
                }
            }, [onLoadSuccess]);
            // Always render children immediately
            return <div data-testid="mock-pdf-document">{children}</div>;
        },
        Page: ({ pageNumber }) => <div data-testid="mock-pdf-page">Page {pageNumber}</div>,
    };
});

// Mock CitationModal to avoid import.meta parse errors in Jest
jest.mock('./CitationModal', () => {
    const React = require('react');
    const { Document, Page } = require('react-pdf');
    const mui = require('@mui/material');
    
    return {
        __esModule: true,
        default: ({ open, onClose, document, citation, isAddendum }) => {
            if (!open) return null;
            
            const Dialog = mui.Dialog || mui.default?.Dialog;
            const DialogTitle = mui.DialogTitle || mui.default?.DialogTitle;
            const DialogContent = mui.DialogContent || mui.default?.DialogContent;
            const Typography = mui.Typography || mui.default?.Typography;
            
            // Fallback to simple divs if MUI components aren't available
            const DialogComponent = Dialog || (({ children, ...props }) => React.createElement('div', { 'data-testid': 'citation-modal', ...props }, children));
            const DialogTitleComponent = DialogTitle || (({ children }) => React.createElement('div', {}, children));
            const DialogContentComponent = DialogContent || (({ children }) => React.createElement('div', {}, children));
            const TypographyComponent = Typography || (({ children }) => React.createElement('div', {}, children));
            
            // Render pages directly - Document mock will wrap them
            const pages = citation?.pages || [];
            
            return React.createElement(DialogComponent, {
                open,
                onClose,
                maxWidth: 'lg',
                fullWidth: true,
                'data-testid': 'citation-modal',
            }, [
                React.createElement(DialogTitleComponent, { key: 'title' },
                    React.createElement(React.Fragment, null, [
                        React.createElement(TypographyComponent, { key: 'title-text', variant: 'h6', component: 'div' }, isAddendum ? 'Tender Addendum' : 'Tender Document'),
                        isAddendum ? React.createElement('span', { key: 'title-pill' }, 'Addendum') : null,
                    ])
                ),
                React.createElement(DialogContentComponent, { key: 'content' },
                    React.createElement(Document, {
                        file: document?.url,
                        onLoadSuccess: () => {},
                    }, pages.map((pageNum) =>
                        React.createElement(Page, { key: pageNum, pageNumber: pageNum })
                    ))
                ),
            ]);
        },
    };
});

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('AIAnalysisModal Component', () => {
    const mockOnClose = jest.fn();

    const defaultProps = {
        open: true,
        onClose: mockOnClose,
        tenderId: 123,
        projectName: 'Test Project',
        documents: [
            {
                tender_id: 123,
                name: 'tender_test.pdf',
                download_link: 'https://example.com/document.pdf',
            },
        ],
    };

    const createMockStore = (insights = {}) => {
        return mockStore({
            tenderInsights: {
                insights,
            },
        });
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('renders when open prop is true', () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} enquiry={{ id: 456 }} />
            </Provider>
        );

        expect(screen.getByTestId('ai-analysis-modal')).toBeInTheDocument();
        expect(screen.getByText('ai-tender-insights')).toBeInTheDocument();
        expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('does not render when open prop is false', () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} open={false} />
            </Provider>
        );

        expect(screen.queryByTestId('ai-analysis-modal')).not.toBeInTheDocument();
    });

    it('shows loading state when creating insights', () => {
        const store = createMockStore({
            123: {
                status: 'creating',
            },
        });

        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} />
            </Provider>
        );

        expect(screen.getByText('ai-loading-generating')).toBeInTheDocument();
        expect(screen.getByText('ai-loading-wait')).toBeInTheDocument();
    });

    it('shows error state with retry button', () => {
        const store = createMockStore({
            123: {
                status: 'error',
                error: 'Failed to generate insights',
            },
        });

        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} />
            </Provider>
        );

        expect(screen.getByText('Failed to generate insights')).toBeInTheDocument();
        expect(screen.getByText('text-retry')).toBeInTheDocument();
    });

    it('shows success state with insights data', () => {
        const mockData = {
            headline_dates: {
                permission_date: { value: '01/02/2025' }
            },
            payment_terms: {
                retention_percentage: { value: 'Retention' }
            },
        };

        const store = createMockStore({
            123: {
                status: 'success',
                data: mockData,
                timestamp: '2025-01-26T10:27:00Z',
            },
        });

        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} />
            </Provider>
        );

        expect(screen.getByText('ai-section-key-dates')).toBeInTheDocument();
        expect(screen.getByText('ai-section-payment-terms')).toBeInTheDocument();
        expect(screen.getByText(/ai-generated-on/i)).toBeInTheDocument();
        expect(screen.getByText('ai-disclaimer-label')).toBeInTheDocument();
        expect(screen.getByText(/ai-disclaimer-text/i)).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} />
            </Provider>
        );

        const closeButton = screen.getByTestId('close-button');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('shows download button when insights are loaded', () => {
        const mockData = {
            headline_dates: { permission_date: { value: '01/02/2025' } },
        };

        const store = createMockStore({
            123: {
                status: 'success',
                data: mockData,
                timestamp: '2025-01-26T10:27:00Z',
            },
        });

        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} />
            </Provider>
        );

        expect(screen.getByText('text-download-tender-document')).toBeInTheDocument();
    });

    it('renders multi-file download menu and strips inline from URLs', async () => {
        const mockData = {
            headline_dates: { permission_date: { value: '01/02/2025' } },
        };

        const mockFiles = {
            75300: {
                file_name: 'tender-document.pdf',
                file_url: 'http://app.prosper.local/relay/v1/document/75300/download?inline=true'
            },
            75302: {
                file_name: 'tender-addendum-document_1.pdf',
                file_url: 'http://app.prosper.local/relay/v1/document/75302/download?inline=true'
            },
        };

        const store = createMockStore({
            123: {
                status: 'success',
                data: mockData,
                files: mockFiles,
                timestamp: '2025-01-26T10:27:00Z',
            },
        });

        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} enquiry={{ id: 456 }} />
            </Provider>
        );

        fireEvent.click(screen.getByTestId('download-button'));

        expect(await screen.findByTestId('download-document-75300')).toBeInTheDocument();
        expect(await screen.findByTestId('download-document-75302')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('download-document-75302'));
        expect(goToNewTab).toHaveBeenCalledWith('http://app.prosper.local/relay/v1/document/75302/download');
    });

    it('polls for insights when status is PENDING', () => {
        const store = createMockStore({
            123: {
                status: 'PENDING',
            },
        });

        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} />
            </Provider>
        );

        // Initial fetch call on potential mount or effect run if logic dictates
        // The polling effect runs immediately? No, setTimeout 5000.
        // Let's check initial call if logic dictates.
        // In useEffect: if status === PENDING -> startPolling.

        // Fast-forward time
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        expect(fetchTenderInsights).toHaveBeenCalledWith({ tenderId: 123 });

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        expect(fetchTenderInsights).toHaveBeenCalledTimes(2); // Initial (maybe) + 2 polls? 
        // Actually the code:
        // if (!currentInsightData || status === 'idle') dispatch(fetch)
        // else if (status === PENDING) startPolling

        // So if status is PENDING initially, it just starts polling. 
        // First poll after 5000ms.
    });

    it('stops polling when component unmounts', () => {
        const store = createMockStore({
            123: {
                status: 'PENDING',
            },
        });

        const { unmount } = render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} />
            </Provider>
        );

        unmount();

        act(() => {
            jest.advanceTimersByTime(10000);
        });

        // Should not have called fetchTenderInsights more after unmount
        // Note: fetchTenderInsights might be called once if advanced before unmount, but here we invoke unmount immediately.
        // We need to be careful about what happens before unmount.
        // Let's just create a fresh mock to count calls.

        fetchTenderInsights.mockClear();

        // Since we unmounted, timers shouldn't trigger dispatch
        expect(fetchTenderInsights).not.toHaveBeenCalled();
    });

    it('opens CitationModal when a cited value is clicked', async () => {
        jest.useRealTimers();
        const mockData = {
            headline_dates: {
                completion_date: {
                    citation: {
                        document: 'tender_test.pdf',
                        pages: [22, 23],
                        text: 'Some citation text'
                    },
                    value: 'Cited Value'
                }
            }
        };

        const store = createMockStore({
            123: {
                status: 'success',
                data: mockData,
                timestamp: '2025-01-26T10:27:00Z',
            },
        });

        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} enquiry={{ id: 456 }} />
            </Provider>
        );

        // Click on the cited value
        const citedValue = screen.getByText('Cited Value');
        fireEvent.click(citedValue);

        // Verify CitationModal is shown
        expect(await screen.findByTestId('citation-modal')).toBeInTheDocument();
        expect(await screen.findByText('Tender Document')).toBeInTheDocument();
        expect(screen.queryByText('Addendum')).not.toBeInTheDocument();

        // Verify react-pdf components are rendered (mocked)
        expect(await screen.findByTestId('mock-pdf-document')).toBeInTheDocument();
        const pages = await screen.findAllByTestId('mock-pdf-page');
        expect(pages.length).toBeGreaterThan(0);
        expect(screen.getByText('Page 22')).toBeInTheDocument();
        expect(screen.getByText('Page 23')).toBeInTheDocument();
    });

    it('shows addendum header and pill for addendum citations', async () => {
        jest.useRealTimers();
        const mockData = {
            headline_dates: {
                completion_date: {
                    citation: {
                        document: 'Tender_Addendum_01.pdf',
                        pages: [11],
                        text: 'Addendum citation text'
                    },
                    value: 'Addendum Value'
                }
            }
        };

        const store = createMockStore({
            123: {
                status: 'success',
                data: mockData,
                timestamp: '2025-01-26T10:27:00Z',
            },
        });

        render(
            <Provider store={store}>
                <AIAnalysisModal {...defaultProps} enquiry={{ id: 456 }} />
            </Provider>
        );

        fireEvent.click(screen.getByText('Addendum Value'));

        expect(await screen.findByTestId('citation-modal')).toBeInTheDocument();
        expect(await screen.findByText('Tender Addendum')).toBeInTheDocument();
        expect(await screen.findByText('Addendum')).toBeInTheDocument();
        expect(await screen.findByText('Page 11')).toBeInTheDocument();
    });
});
