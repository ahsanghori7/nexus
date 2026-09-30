import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  cardItemProps,
  creationCardActionButtonSx,
  creationCardPaperProps,
  doubleItemProps,
  subItemProps,
  titleProps,
  titleSx,
  buttonBaseSx,
  Container,
} from './containerStyles';

describe('BOQ Container Style Components', () => {
  describe('Container component', () => {
    it('renders children correctly', () => {
      const { getByText } = render(
        <Container>
          <div>Test content</div>
        </Container>
      );
      
      expect(getByText('Test content')).toBeInTheDocument();
    });

    it('applies correct styling structure', () => {
      const { container } = render(
        <Container>
          <div>Test content</div>
        </Container>
      );
      
      const boxElement = container.firstChild;
      expect(boxElement).toHaveStyle('width: 100%');
    });
  });

  describe('Exported style objects', () => {
    it('exports cardItemProps with correct structure', () => {
      expect(cardItemProps).toEqual({
        xs: 12,
        sm: 5,
        md: 5,
      });
    });

    it('exports doubleItemProps with correct structure', () => {
      expect(doubleItemProps).toEqual({
        xs: 12,
        sm: 5,
        md: 5,
      });
    });

    it('exports subItemProps with correct structure', () => {
      expect(subItemProps).toEqual({
        xs: 12,
        sm: 6,
      });
    });

    it('exports titleProps with correct properties', () => {
      expect(titleProps).toEqual({
        fontSize: '14px',
        color: expect.any(String),
        fontWeight: 'bold',
        textAlign: 'center',
      });
    });

    it('exports titleSx with correct properties', () => {
      expect(titleSx).toEqual(
        expect.objectContaining({
          fontSize: '14px',
          pb: 0.5,
          color: expect.any(String),
          fontWeight: 'bold',
          textAlign: 'center',
        })
      );
    });

    it('exports buttonBaseSx with correct structure', () => {
      expect(buttonBaseSx).toEqual(
        expect.objectContaining({
          display: 'block',
          '&::after': expect.objectContaining({
            content: '""',
            display: 'block',
            width: '100%',
            height: '150px',
            marginRight: 1,
            backgroundImage: expect.any(String),
            backgroundSize: 'cover',
          }),
        })
      );
    });

    it('exports creationCardPaperProps with correct structure', () => {
      expect(creationCardPaperProps).toEqual({
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        borderRadius: '8px',
      });
    });

    it('exports creationCardActionButtonSx with correct structure', () => {
      expect(creationCardActionButtonSx).toEqual({
        mt: 2,
        width: '100%',
        textTransform: 'none',
        fontSize: '13px',
        py: 1.25,
        borderRadius: '8px',
      });
    });
  });
});