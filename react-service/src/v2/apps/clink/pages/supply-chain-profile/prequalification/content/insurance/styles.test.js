import { insurancesSx, commonSx } from './styles';

describe('insurance styles', () => {
  it('exports insurancesSx with expected properties', () => {
    expect(insurancesSx).toHaveProperty('display');
    expect(insurancesSx).toHaveProperty('alignItems');
    expect(insurancesSx).toHaveProperty('justifyContent');
    expect(insurancesSx).toHaveProperty('borderRadius');
    expect(insurancesSx).toHaveProperty('minWidth');
    expect(insurancesSx).toHaveProperty('height');
  });

  it('exports commonSx with expected properties', () => {
    expect(commonSx).toHaveProperty('display', 'flex');
    expect(commonSx).toHaveProperty('alignItems', 'center');
    expect(commonSx).toHaveProperty('justifyContent', 'center');
    expect(commonSx).toHaveProperty('borderRadius', '3px');
    expect(commonSx).toHaveProperty('height', '32px');
  });

  it('insurancesSx includes commonSx properties', () => {
    expect(insurancesSx.display).toBe(commonSx.display);
    expect(insurancesSx.alignItems).toBe(commonSx.alignItems);
    expect(insurancesSx.justifyContent).toBe(commonSx.justifyContent);
  });

  it('insurancesSx has additional positioning properties', () => {
    expect(insurancesSx).toHaveProperty('position', 'absolute');
    expect(insurancesSx).toHaveProperty('top', 0);
    expect(insurancesSx).toHaveProperty('width', '100%');
  });

  it('has expected responsive minWidth values', () => {
    expect(commonSx.minWidth).toEqual({ xs: 0, lg: '150px' });
    expect(insurancesSx.minWidth).toEqual({ xs: 0, lg: '150px' });
  });
});