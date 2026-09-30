import { modalSx, acceptStyle, cancelStyle } from './style';

describe('Submit Quote Styles', () => {
  describe('modalSx', () => {
    it('should export modalSx object with correct structure', () => {
      expect(modalSx).toBeDefined();
      expect(typeof modalSx).toBe('object');
      expect(modalSx.width).toBe('420px');
      expect(modalSx.backgroundColor).toBe('transparent');
      expect(modalSx.paddingBottom).toBe('30px');
      expect(modalSx.boxShadow).toBe('none');
    });

    it('should have nested MuiPaper-root styles', () => {
      expect(modalSx['& .MuiPaper-root']).toBeDefined();
      expect(modalSx['& .MuiPaper-root'].margin).toBe('0 auto');
      expect(modalSx['& .MuiPaper-root'].boxShadow).toBe('none');
    });

    it('should have nested MuiBox-root styles', () => {
      expect(modalSx['&> .MuiBox-root']).toBeDefined();
      expect(modalSx['&> .MuiBox-root'].position).toBe('relative');
      expect(modalSx['&> .MuiBox-root'].paddingTop).toBe('8px');
    });
  });

  describe('acceptStyle', () => {
    it('should export acceptStyle object with correct properties', () => {
      expect(acceptStyle).toBeDefined();
      expect(typeof acceptStyle).toBe('object');
      expect(acceptStyle.bgcolor).toBe('#FFFFFF');
    });

    it('should have hover state styles', () => {
      expect(acceptStyle['&:hover']).toBeDefined();
      expect(acceptStyle['&:hover'].border).toBe(0);
      expect(acceptStyle['&:hover'].color).toBe('#FFFFFF');
    });

    it('should have disabled state styles', () => {
      expect(acceptStyle['&.Mui-disabled']).toBeDefined();
      expect(acceptStyle['&.Mui-disabled'].color).toBe('#FFFFFF');
      expect(acceptStyle['&.Mui-disabled'].border).toBe(0);
    });
  });

  describe('cancelStyle', () => {
    it('should export cancelStyle object with correct properties', () => {
      expect(cancelStyle).toBeDefined();
      expect(typeof cancelStyle).toBe('object');
      expect(cancelStyle.color).toBe('#FFFFFF');
    });

    it('should have hover state styles', () => {
      expect(cancelStyle['&:hover']).toBeDefined();
      expect(typeof cancelStyle['&:hover']).toBe('object');
    });
  });

  describe('All styles', () => {
    it('should export all three style objects', () => {
      expect(modalSx).toBeDefined();
      expect(acceptStyle).toBeDefined();
      expect(cancelStyle).toBeDefined();
    });
  });
});