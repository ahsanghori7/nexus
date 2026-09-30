import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import {
  themeTable,
  AvtarGridContainer,
  CompanyGridContainer,
  StatusGridContainer,
} from './Mui.Components';

// Mock the clink-components module
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        clinkBackgroundPurple: '#6200EA',
        clinkLightPurple: '#E1BEE7',
      },
    },
    fonts: {
      proxima_nova1: 'Proxima Nova',
      proxima_nova2: 'Arial',
    },
  },
}));

describe('Mui Components', () => {
  describe('themeTable', () => {
    it('should be defined', () => {
      expect(themeTable).toBeDefined();
      expect(typeof themeTable).toBe('object');
    });
  });

  describe('AvtarGridContainer', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <ThemeProvider theme={themeTable}>
          <Grid container>
            <AvtarGridContainer>
              <div>Test Content</div>
            </AvtarGridContainer>
          </Grid>
        </ThemeProvider>
      );
      expect(container).toBeTruthy();
    });

    it('should render children content', () => {
      const { getByText } = render(
        <ThemeProvider theme={themeTable}>
          <Grid container>
            <AvtarGridContainer>
              <div>Avatar Content</div>
            </AvtarGridContainer>
          </Grid>
        </ThemeProvider>
      );
      expect(getByText('Avatar Content')).toBeInTheDocument();
    });
  });

  describe('CompanyGridContainer', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <ThemeProvider theme={themeTable}>
          <Grid container>
            <CompanyGridContainer>
              <div>Company Content</div>
            </CompanyGridContainer>
          </Grid>
        </ThemeProvider>
      );
      expect(container).toBeTruthy();
    });

    it('should render children content', () => {
      const { getByText } = render(
        <ThemeProvider theme={themeTable}>
          <Grid container>
            <CompanyGridContainer>
              <div>Company Name</div>
            </CompanyGridContainer>
          </Grid>
        </ThemeProvider>
      );
      expect(getByText('Company Name')).toBeInTheDocument();
    });
  });

  describe('StatusGridContainer', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <ThemeProvider theme={themeTable}>
          <StatusGridContainer>
            <div>Status Content</div>
          </StatusGridContainer>
        </ThemeProvider>
      );
      expect(container).toBeTruthy();
    });

    it('should render children content', () => {
      const { getByText } = render(
        <ThemeProvider theme={themeTable}>
          <StatusGridContainer>
            <div>Status Info</div>
          </StatusGridContainer>
        </ThemeProvider>
      );
      expect(getByText('Status Info')).toBeInTheDocument();
    });
  });
});