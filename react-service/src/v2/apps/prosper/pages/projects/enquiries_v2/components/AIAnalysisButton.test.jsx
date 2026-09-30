import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AIAnalysisButton from './AIAnalysisButton';

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const translations = {
                "view-tender-insights": "View AI Results",
                "analyze-with-ai": "Analyse with AI"
            };
            return translations[key] || key;
        },
    }),
}));

jest.mock('@mui/material/styles', () => {
    const actual = jest.requireActual('@mui/material/styles');
    return {
        ...actual,
        styled: (Component) => () => Component,
        useTheme: () => ({
            palette: {
                divider: '#e0e0e0',
                text: {
                    primary: '#000000',
                    secondary: '#757575',
                },
            },
        }),
    };
});

describe('AIAnalysisButton Component', () => {
    it('renders "Analyse with AI" when not viewed', () => {
        const handleClick = jest.fn();
        render(<AIAnalysisButton hasViewed={false} onClick={handleClick} />);

        expect(screen.getByTestId('ai-analysis-button')).toBeInTheDocument();
        expect(screen.getByText('Analyse with AI')).toBeInTheDocument();
    });

    it('renders "View AI Results" when viewed', () => {
        const handleClick = jest.fn();
        render(<AIAnalysisButton hasViewed={true} onClick={handleClick} />);

        expect(screen.getByTestId('ai-analysis-button')).toBeInTheDocument();
        expect(screen.getByText('View AI Results')).toBeInTheDocument();
    });

    it('calls onClick handler when clicked', () => {
        const handleClick = jest.fn();
        render(<AIAnalysisButton hasViewed={false} onClick={handleClick} />);

        const button = screen.getByTestId('ai-analysis-button');
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('defaults to hasViewed=false when prop not provided', () => {
        const handleClick = jest.fn();
        render(<AIAnalysisButton onClick={handleClick} />);

        expect(screen.getByText('Analyse with AI')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
        const handleClick = jest.fn();
        render(<AIAnalysisButton onClick={handleClick} disabled={true} />);

        const button = screen.getByTestId('ai-analysis-button');
        expect(button).toBeDisabled();
    });

    it('shows tooltip when disabled', () => {
        const handleClick = jest.fn();
        render(
            <AIAnalysisButton
                onClick={handleClick}
                disabled={true}
                tooltipTitle="text-tender-document-needed-for-ai"
            />
        );

        const tooltip = screen.getByTestId('mui-tooltip');
        expect(tooltip).toHaveAttribute('data-title', 'text-tender-document-needed-for-ai');
    });
});
