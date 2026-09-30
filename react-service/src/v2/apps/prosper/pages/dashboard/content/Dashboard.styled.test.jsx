import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import StyledContainer, {
  StyledItem,
  StyledContent,
  StyledFooter,
  Slide,
  Content,
  QuottedParagraph,
  QuottedParagraphText,
  QuottedParagraphSubtext,
  SubtextStrong,
  ButtonWrapper,
  PinkHighlight,
  ResourceContent,
} from './Dashboard.styled';

// Mock the dependencies
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        prosperBoxShadow: 'rgba(0,0,0,0.1)',
        prosperGrayBorder: '#e1e8ed',
        prosperRedBorder: '#ff0000',
        prosperBoxRed: '#ffebee',
        fog: '#f5f5f5'
      },
      general: {
        white: '#ffffff',
        japaneseIndigo: '#3f4854'
      }
    },
    fonts: {
      avantGardeGothicPRO: 'AvantGardeGothicPRO'
    },
    dimensions: {
      MD_SCREEN: 768,
      LG_SCREEN: 992,
      XL_SCREEN: 1200
    }
  }
}));

jest.mock('v2/apps/shared/styled/Page.styled', () => 'div');

describe('Dashboard Styled Components', () => {
  const mockTheme = {};

  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        {component}
      </ThemeProvider>
    );
  };

  describe('StyledContainer', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <StyledContainer>
          <div>Container content</div>
        </StyledContainer>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with columns prop', () => {
      const { container } = renderWithTheme(
        <StyledContainer columns>
          <div>Columns layout</div>
        </StyledContainer>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with grid prop', () => {
      const { container } = renderWithTheme(
        <StyledContainer grid>
          <div>Grid layout</div>
        </StyledContainer>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies grid display style', () => {
      const { container } = renderWithTheme(
        <StyledContainer>
          Content
        </StyledContainer>
      );
      const element = container.firstChild;
      const computedStyle = window.getComputedStyle(element);
      expect(computedStyle.display).toBe('grid');
    });
  });

  describe('StyledItem', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <StyledItem>
          <div>Item content</div>
        </StyledItem>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with one prop', () => {
      const { container } = renderWithTheme(
        <StyledItem one>
          <div>Item one</div>
        </StyledItem>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with two prop', () => {
      const { container } = renderWithTheme(
        <StyledItem two>
          <div>Item two</div>
        </StyledItem>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with three prop', () => {
      const { container } = renderWithTheme(
        <StyledItem three>
          <div>Item three</div>
        </StyledItem>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with four prop', () => {
      const { container } = renderWithTheme(
        <StyledItem four>
          <div>Item four</div>
        </StyledItem>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with five prop', () => {
      const { container } = renderWithTheme(
        <StyledItem five>
          <div>Item five</div>
        </StyledItem>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with six prop', () => {
      const { container } = renderWithTheme(
        <StyledItem six>
          <div>Item six</div>
        </StyledItem>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('StyledContent', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <StyledContent>
          <div>Content</div>
        </StyledContent>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with hasFooter prop', () => {
      const { container } = renderWithTheme(
        <StyledContent hasFooter>
          <div>Content with footer</div>
        </StyledContent>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with height prop', () => {
      const { container } = renderWithTheme(
        <StyledContent height={500}>
          <div>Content with custom height</div>
        </StyledContent>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with marginBottom prop', () => {
      const { container } = renderWithTheme(
        <StyledContent marginBottom={20}>
          <div>Content with margin</div>
        </StyledContent>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('StyledFooter', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <StyledFooter>
          <button>Footer button</button>
        </StyledFooter>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders button content', () => {
      const { getByText } = renderWithTheme(
        <StyledFooter>
          <button>Action Button</button>
        </StyledFooter>
      );
      expect(getByText('Action Button')).toBeInTheDocument();
    });
  });

  describe('Slide', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <Slide>
          <div>Slide content</div>
        </Slide>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with marginTop prop', () => {
      const { container } = renderWithTheme(
        <Slide marginTop={30}>
          <div>Slide with margin</div>
        </Slide>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <Content>
          <div>Content block</div>
        </Content>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders text content', () => {
      const { getByText } = renderWithTheme(
        <Content>
          Text content here
        </Content>
      );
      expect(getByText('Text content here')).toBeInTheDocument();
    });
  });

  describe('QuottedParagraph', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <QuottedParagraph>
          <div>Quoted content</div>
        </QuottedParagraph>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('QuottedParagraphText', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <QuottedParagraphText>
          Quoted text
        </QuottedParagraphText>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders text content', () => {
      const { getByText } = renderWithTheme(
        <QuottedParagraphText>
          "This is quoted text"
        </QuottedParagraphText>
      );
      expect(getByText('"This is quoted text"')).toBeInTheDocument();
    });
  });

  describe('QuottedParagraphSubtext', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <QuottedParagraphSubtext>
          Subtext content
        </QuottedParagraphSubtext>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('SubtextStrong', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <SubtextStrong>
          Strong subtext
        </SubtextStrong>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders strong text content', () => {
      const { getByText } = renderWithTheme(
        <SubtextStrong>
          Bold important text
        </SubtextStrong>
      );
      expect(getByText('Bold important text')).toBeInTheDocument();
    });
  });

  describe('ButtonWrapper', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <ButtonWrapper>
          <button>Wrapped button</button>
        </ButtonWrapper>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders button content', () => {
      const { getByRole } = renderWithTheme(
        <ButtonWrapper>
          <button>Click me</button>
        </ButtonWrapper>
      );
      expect(getByRole('button')).toBeInTheDocument();
    });
  });

  describe('PinkHighlight', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <PinkHighlight>
          Highlighted text
        </PinkHighlight>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders highlighted text', () => {
      const { getByText } = renderWithTheme(
        <PinkHighlight>
          Important highlighted content
        </PinkHighlight>
      );
      expect(getByText('Important highlighted content')).toBeInTheDocument();
    });
  });

  describe('ResourceContent', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(
        <ResourceContent>
          <div>Resource content</div>
        </ResourceContent>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders resource children', () => {
      const { getByText } = renderWithTheme(
        <ResourceContent>
          <h3>Resource Title</h3>
          <p>Resource description</p>
        </ResourceContent>
      );
      expect(getByText('Resource Title')).toBeInTheDocument();
      expect(getByText('Resource description')).toBeInTheDocument();
    });
  });
});