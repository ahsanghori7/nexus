import React from 'react';
import { render, screen } from '@testing-library/react';
import AIBadge from './AIBadge';

// Mock react-i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
    }),
}));

describe('AIBadge Component', () => {
    it('renders with correct translation key', () => {
        render(<AIBadge />);
        expect(screen.getByTestId('ai-badge')).toBeInTheDocument();
        expect(screen.getByText('ai-analysis-available')).toBeInTheDocument();
    });
});
