import { doubleItemProps, subItemProps, titleProps, titleSx, buttonBaseSx } from './style';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        black: '#000000'
      }
    },
    s3: {
      boqScratch: 'https://example.com/boq-scratch.jpg'
    }
  }
}));

describe('quote-history style constants', () => {
  it('exports doubleItemProps with correct values', () => {
    expect(doubleItemProps).toEqual({
      xs: 12,
      sm: 8,
    });
  });

  it('exports subItemProps with correct values', () => {
    expect(subItemProps).toEqual({
      xs: 12,
      sm: 6,
    });
  });

  it('exports titleProps with correct values', () => {
    expect(titleProps).toEqual({
      fontSize: '14px',
      color: '#000000',
      fontWeight: 'bold',
      textAlign: 'center',
    });
  });

  it('exports titleSx with correct values', () => {
    // titleSx sets fontSize first, then spreads titleProps which overrides it back to '14px'
    expect(titleSx).toEqual({
      fontSize: '14px',  // overridden by titleProps spread
      pb: 0.5,
      color: '#000000',
      fontWeight: 'bold',
      textAlign: 'center',
    });
  });

  it('exports buttonBaseSx with correct values', () => {
    expect(buttonBaseSx).toEqual({
      display: 'block',
      '&::after': {
        content: '""',
        display: 'block',
        width: '100%',
        height: '150px',
        marginRight: 1,
        backgroundImage: `url('https://example.com/boq-scratch.jpg')`,
        backgroundSize: 'cover',
      },
    });
  });
});