import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  StyledTeamContent 
} from './styled';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      carretDownGray: 'carret-down-gray-url',
    },
    colors: {
      general: {
        darkCharcoal: '#333333',
        white: '#ffffff',
        clinkLightPurple: '#e6e6fa',
        lightPeriwinkle: '#c5c5d0',
        eerieBlack: '#1b1b1b',
        clinkBackgroundPurple: '#f8f7ff',
        clinkGreen: '#28a745',
      },
      prosper: {
        prosperGrayBorder: '#d1d1d1',
      },
    },
    dimensions: {
      LG_SCREEN: 1200,
      SM_SCREEN: 768,
    },
    fonts: {
      sofia: 'Sofia',
      proxima_nova1: 'ProximaNova1',
      proxima_nova2: 'ProximaNova2',
    },
  },
}));

describe('Team Manager Styled Components', () => {
  test('StyledTeamContent renders without crashing', () => {
    render(
      <StyledTeamContent>
        <div>Test content</div>
      </StyledTeamContent>
    );
  });

  test('StyledTeamContent renders children correctly', () => {
    const { getByText } = render(
      <StyledTeamContent>
        <div>Styled content test</div>
      </StyledTeamContent>
    );
    
    expect(getByText('Styled content test')).toBeInTheDocument();
  });

  test('StyledTeamContent handles multiple children', () => {
    const { getByText } = render(
      <StyledTeamContent>
        <div>First child</div>
        <div>Second child</div>
      </StyledTeamContent>
    );
    
    expect(getByText('First child')).toBeInTheDocument();
    expect(getByText('Second child')).toBeInTheDocument();
  });

  test('creates snapshot', () => {
    const { container } = render(
      <StyledTeamContent>
        <div>Snapshot test</div>
      </StyledTeamContent>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});