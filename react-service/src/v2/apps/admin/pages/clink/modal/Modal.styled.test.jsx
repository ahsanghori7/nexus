import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Container,
  Item,
  Typography,
  SubItem,
  PageTitle,
  StyledItemAutocomplete,
} from './Modal.styled';

describe('Modal.styled Components', () => {
  describe('Container', () => {
    it('renders children correctly', () => {
      const { getByText } = render(
        <Container>
          <div>Test Content</div>
        </Container>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('renders with MUI Grid component', () => {
      const { getByTestId } = render(
        <Container>
          <div>Test</div>
        </Container>
      );

      expect(getByTestId('mui-grid')).toBeInTheDocument();
    });
  });

  describe('Item', () => {
    it('renders children correctly', () => {
      const { getByText } = render(
        <Item>
          <span>Item Content</span>
        </Item>
      );

      expect(getByText('Item Content')).toBeInTheDocument();
    });

    it('renders with MUI Grid component', () => {
      const { getByTestId } = render(
        <Item>
          <span>Test</span>
        </Item>
      );

      expect(getByTestId('mui-grid')).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('renders with default props', () => {
      const { getByText } = render(
        <Typography>Default Typography</Typography>
      );

      expect(getByText('Default Typography')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
      const { getByText } = render(
        <Typography 
          sx={{ fontSize: '20px' }}
          fontStyle="normal"
          color="primary"
          variant="h1"
        >
          Custom Typography
        </Typography>
      );

      expect(getByText('Custom Typography')).toBeInTheDocument();
    });
  });

  describe('SubItem', () => {
    it('renders children correctly', () => {
      const { getByText } = render(
        <SubItem>
          <input type="text" />
          SubItem Content
        </SubItem>
      );

      expect(getByText('SubItem Content')).toBeInTheDocument();
    });

    it('renders with MUI Grid component', () => {
      const { getByTestId } = render(
        <SubItem>
          <span>Test</span>
        </SubItem>
      );

      expect(getByTestId('mui-grid')).toBeInTheDocument();
    });
  });

  describe('PageTitle', () => {
    it('renders title text correctly', () => {
      const { getByText } = render(
        <PageTitle>Page Title Text</PageTitle>
      );

      expect(getByText('Page Title Text')).toBeInTheDocument();
    });

    it('uses Typography component', () => {
      const { getByTestId } = render(
        <PageTitle>Test Title</PageTitle>
      );

      expect(getByTestId('mui-typography')).toBeInTheDocument();
    });
  });

  describe('StyledItemAutocomplete', () => {
    it('renders children correctly', () => {
      const { getByText } = render(
        <StyledItemAutocomplete>
          <div>Autocomplete Content</div>
        </StyledItemAutocomplete>
      );

      expect(getByText('Autocomplete Content')).toBeInTheDocument();
    });

    it('applies styled-components styling', () => {
      const { container } = render(
        <StyledItemAutocomplete>
          <div>Test</div>
        </StyledItemAutocomplete>
      );

      const styledElement = container.firstChild;
      expect(styledElement).toHaveStyle('flex: 1 0 100%');
      expect(styledElement).toHaveStyle('margin-bottom: 15px');
      expect(styledElement).toHaveStyle('display: flex');
      expect(styledElement).toHaveStyle('flex-direction: column');
    });
  });
});