import {
  startFromScratchActionButtonSx,
  startFromScratchAddIconSx,
  startFromScratchCardDisabledSx,
  startFromScratchCardSx,
  startFromScratchDescriptionSx,
  startFromScratchIconBoxSx,
  startFromScratchIconSx,
  startFromScratchTitleSx,
} from './cardStyles';

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        black: '#000000',
        clinkLightPurple: '#E8E4F3',
        brightGray: '#F3F4F6',
        white: '#FFFFFF',
      },
    },
  },
}));

jest.mock('v2/apps/clink/pages/boq/container/containerStyles', () => ({
  creationCardActionButtonSx: {
    mt: 2,
    width: '100%',
    textTransform: 'none',
    fontSize: '13px',
    py: 1.25,
    borderRadius: '8px',
  },
}));

describe('StartFromScratchCard style', () => {
  it('exports card layout styles', () => {
    expect(startFromScratchCardSx).toEqual({
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      p: 2,
    });
  });

  it('exports disabled card styles', () => {
    expect(startFromScratchCardDisabledSx).toEqual({
      opacity: 0.5,
      pointerEvents: 'none',
    });
  });

  it('exports icon box styles', () => {
    expect(startFromScratchIconBoxSx).toEqual({
      width: '72px',
      height: '72px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F3F4F6',
      mb: 2,
    });
  });

  it('exports icon styles', () => {
    expect(startFromScratchIconSx).toEqual({
      color: '#000000',
      opacity: 0.55,
      fontSize: 36,
    });
  });

  it('exports title styles', () => {
    expect(startFromScratchTitleSx).toEqual({
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#000000',
      mb: 0.5,
    });
  });

  it('exports description styles', () => {
    expect(startFromScratchDescriptionSx).toEqual({
      fontSize: '13px',
      color: '#000000',
      opacity: 0.6,
    });
  });

  it('exports add icon styles', () => {
    expect(startFromScratchAddIconSx).toEqual({
      color: '#000000',
      opacity: 0.7,
      fontSize: 18,
    });
  });

  it('merges shared action button styles with outlined variant', () => {
    expect(startFromScratchActionButtonSx).toEqual({
      mt: 2,
      width: '100%',
      textTransform: 'none',
      fontSize: '13px',
      py: 1.25,
      borderRadius: '8px',
      color: '#000000',
      backgroundColor: '#FFFFFF',
      borderColor: '#E8E4F3',
      '&:hover': {
        backgroundColor: '#FFFFFF',
        borderColor: '#E8E4F3',
      },
    });
  });
});
