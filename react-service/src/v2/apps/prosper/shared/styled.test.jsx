import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import {
  StyledModalContent,
  StyledTokenModalText,
  StyledSuccesContent,
  StyledSuccesContentDescription,
  StyledSuccesContentChecked,
  StyledSuccesContentStripe,
  StyledTokenOffers,
  StyledTokenOffersItem,
  StyledTokenOffersItemPrice,
  StyledTokenOffersItemPriceToken,
  StyledTokenOffersItemPriceTokenNumber,
  StyledTokenOffersItemSavings,
  StyledTokenOffersItemButton,
  StyledTokenGreenText,
  StyledH1,
  StyledTokenSubnote,
  StyledTokenLinkWrapper,
  StyledTokenLink,
  StyledTokenRedText,
  StyledNeedHelpWrapper,
  StyledNeedHelpDescription,
  StyledNeedHelpBold,
  StyledNeedHelpLigament,
} from './styled';

// Mock theme for styled-components
const mockTheme = {};

describe('Styled Components', () => {
  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        {component}
      </ThemeProvider>
    );
  };

  describe('StyledModalContent', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledModalContent data-testid="modal-content">
          Modal Content
        </StyledModalContent>
      );
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });

    it('accepts position prop', () => {
      renderWithTheme(
        <StyledModalContent position="relative" data-testid="modal-content">
          Content
        </StyledModalContent>
      );
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });
  });

  describe('StyledTokenModalText', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenModalText data-testid="token-modal-text">
          Token Text
        </StyledTokenModalText>
      );
      expect(screen.getByTestId('token-modal-text')).toBeInTheDocument();
    });

    it('accepts noMargin prop', () => {
      renderWithTheme(
        <StyledTokenModalText noMargin data-testid="token-modal-text">
          No Margin Text
        </StyledTokenModalText>
      );
      expect(screen.getByTestId('token-modal-text')).toBeInTheDocument();
    });
  });

  describe('StyledSuccesContent', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledSuccesContent data-testid="success-content">
          Success Content
        </StyledSuccesContent>
      );
      expect(screen.getByTestId('success-content')).toBeInTheDocument();
    });
  });

  describe('StyledSuccesContentDescription', () => {
    it('renders as h3 element', () => {
      renderWithTheme(
        <StyledSuccesContentDescription data-testid="success-description">
          Success Description
        </StyledSuccesContentDescription>
      );
      const element = screen.getByTestId('success-description');
      expect(element).toBeInTheDocument();
      expect(element.tagName).toBe('H3');
    });
  });

  describe('StyledSuccesContentChecked', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledSuccesContentChecked data-testid="success-checked">
          Checked
        </StyledSuccesContentChecked>
      );
      expect(screen.getByTestId('success-checked')).toBeInTheDocument();
    });
  });

  describe('StyledSuccesContentStripe', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledSuccesContentStripe data-testid="success-stripe">
          Stripe
        </StyledSuccesContentStripe>
      );
      expect(screen.getByTestId('success-stripe')).toBeInTheDocument();
    });
  });

  describe('StyledTokenOffers', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenOffers data-testid="token-offers">
          Token Offers
        </StyledTokenOffers>
      );
      expect(screen.getByTestId('token-offers')).toBeInTheDocument();
    });
  });

  describe('StyledTokenOffersItem', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenOffersItem data-testid="token-offers-item">
          Token Item
        </StyledTokenOffersItem>
      );
      expect(screen.getByTestId('token-offers-item')).toBeInTheDocument();
    });
  });

  describe('StyledTokenOffersItemPrice', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenOffersItemPrice data-testid="token-price">
          Price
        </StyledTokenOffersItemPrice>
      );
      expect(screen.getByTestId('token-price')).toBeInTheDocument();
    });
  });

  describe('StyledTokenOffersItemPriceToken', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenOffersItemPriceToken data-testid="price-token">
          Token
        </StyledTokenOffersItemPriceToken>
      );
      expect(screen.getByTestId('price-token')).toBeInTheDocument();
    });
  });

  describe('StyledTokenOffersItemPriceTokenNumber', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenOffersItemPriceTokenNumber data-testid="token-number">
          123
        </StyledTokenOffersItemPriceTokenNumber>
      );
      expect(screen.getByTestId('token-number')).toBeInTheDocument();
    });
  });

  describe('StyledTokenOffersItemSavings', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenOffersItemSavings data-testid="token-savings">
          Savings
        </StyledTokenOffersItemSavings>
      );
      expect(screen.getByTestId('token-savings')).toBeInTheDocument();
    });
  });

  describe('StyledTokenOffersItemButton', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenOffersItemButton data-testid="token-button">
          Button
        </StyledTokenOffersItemButton>
      );
      expect(screen.getByTestId('token-button')).toBeInTheDocument();
    });
  });

  describe('StyledTokenGreenText', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenGreenText data-testid="green-text">
          Green Text
        </StyledTokenGreenText>
      );
      expect(screen.getByTestId('green-text')).toBeInTheDocument();
    });
  });

  describe('StyledH1', () => {
    it('renders as h1 element', () => {
      renderWithTheme(
        <StyledH1 data-testid="styled-h1">
          Heading
        </StyledH1>
      );
      const element = screen.getByTestId('styled-h1');
      expect(element).toBeInTheDocument();
      expect(element.tagName).toBe('H1');
    });
  });

  describe('StyledTokenSubnote', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenSubnote data-testid="token-subnote">
          Subnote
        </StyledTokenSubnote>
      );
      expect(screen.getByTestId('token-subnote')).toBeInTheDocument();
    });
  });

  describe('StyledTokenLinkWrapper', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenLinkWrapper data-testid="link-wrapper">
          Link Wrapper
        </StyledTokenLinkWrapper>
      );
      expect(screen.getByTestId('link-wrapper')).toBeInTheDocument();
    });
  });

  describe('StyledTokenLink', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenLink data-testid="token-link">
          Link
        </StyledTokenLink>
      );
      expect(screen.getByTestId('token-link')).toBeInTheDocument();
    });
  });

  describe('StyledTokenRedText', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledTokenRedText data-testid="red-text">
          Red Text
        </StyledTokenRedText>
      );
      expect(screen.getByTestId('red-text')).toBeInTheDocument();
    });
  });

  describe('StyledNeedHelpWrapper', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledNeedHelpWrapper data-testid="need-help-wrapper">
          Need Help
        </StyledNeedHelpWrapper>
      );
      expect(screen.getByTestId('need-help-wrapper')).toBeInTheDocument();
    });
  });

  describe('StyledNeedHelpDescription', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledNeedHelpDescription data-testid="need-help-description">
          Description
        </StyledNeedHelpDescription>
      );
      expect(screen.getByTestId('need-help-description')).toBeInTheDocument();
    });
  });

  describe('StyledNeedHelpBold', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledNeedHelpBold data-testid="need-help-bold">
          Bold Text
        </StyledNeedHelpBold>
      );
      expect(screen.getByTestId('need-help-bold')).toBeInTheDocument();
    });
  });

  describe('StyledNeedHelpLigament', () => {
    it('renders without crashing', () => {
      renderWithTheme(
        <StyledNeedHelpLigament data-testid="need-help-ligament">
          -
        </StyledNeedHelpLigament>
      );
      expect(screen.getByTestId('need-help-ligament')).toBeInTheDocument();
    });
  });

  // Group test for all components
  describe('All Styled Components', () => {
    it('all components render and accept data-testid', () => {
      const components = [
        { Component: StyledModalContent, name: 'modal-content' },
        { Component: StyledTokenModalText, name: 'token-modal-text' },
        { Component: StyledSuccesContent, name: 'success-content' },
        { Component: StyledSuccesContentDescription, name: 'success-description' },
        { Component: StyledSuccesContentChecked, name: 'success-checked' },
        { Component: StyledSuccesContentStripe, name: 'success-stripe' },
        { Component: StyledTokenOffers, name: 'token-offers' },
        { Component: StyledTokenOffersItem, name: 'token-offers-item' },
        { Component: StyledTokenOffersItemPrice, name: 'token-price' },
        { Component: StyledTokenOffersItemPriceToken, name: 'price-token' },
        { Component: StyledTokenOffersItemPriceTokenNumber, name: 'token-number' },
        { Component: StyledTokenOffersItemSavings, name: 'token-savings' },
        { Component: StyledTokenOffersItemButton, name: 'token-button' },
        { Component: StyledTokenGreenText, name: 'green-text' },
        { Component: StyledH1, name: 'styled-h1' },
        { Component: StyledTokenSubnote, name: 'token-subnote' },
        { Component: StyledTokenLinkWrapper, name: 'link-wrapper' },
        { Component: StyledTokenLink, name: 'token-link' },
        { Component: StyledTokenRedText, name: 'red-text' },
        { Component: StyledNeedHelpWrapper, name: 'need-help-wrapper' },
        { Component: StyledNeedHelpDescription, name: 'need-help-description' },
        { Component: StyledNeedHelpBold, name: 'need-help-bold' },
        { Component: StyledNeedHelpLigament, name: 'need-help-ligament' },
      ];

      components.forEach(({ Component, name }) => {
        renderWithTheme(
          <Component data-testid={name}>
            Test Content
          </Component>
        );
        expect(screen.getByTestId(name)).toBeInTheDocument();
      });
    });
  });
});