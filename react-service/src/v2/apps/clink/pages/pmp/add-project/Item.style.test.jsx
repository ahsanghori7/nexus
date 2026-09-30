import { modalBoxStyle, modalHeaderStyle, modalBodyStyle, modalFooterStyle } from './Item.style';

describe('Item.style', () => {
  test('exports modalBoxStyle with correct properties', () => {
    expect(modalBoxStyle).toBeDefined();
    expect(modalBoxStyle).toHaveProperty('position', 'absolute');
    expect(modalBoxStyle).toHaveProperty('top', '50%');
    expect(modalBoxStyle).toHaveProperty('left', '50%');
    expect(modalBoxStyle).toHaveProperty('transform', 'translate(-50%, -50%)');
    expect(modalBoxStyle).toHaveProperty('width', 'calc(100% - 40px)');
    expect(modalBoxStyle).toHaveProperty('maxWidth', '600px');
    expect(modalBoxStyle).toHaveProperty('maxHeight', '90vh');
    expect(modalBoxStyle).toHaveProperty('display', 'flex');
    expect(modalBoxStyle).toHaveProperty('flexDirection', 'column');
    expect(modalBoxStyle).toHaveProperty('overflow', 'hidden');
    expect(modalBoxStyle).toHaveProperty('p', 0);
    expect(modalBoxStyle).toHaveProperty('borderRadius', 2);
    expect(modalBoxStyle).toHaveProperty('outline', 0);
  });

  test('exports modalHeaderStyle with correct properties', () => {
    expect(modalHeaderStyle).toBeDefined();
    expect(modalHeaderStyle).toHaveProperty('py', 2);
    expect(modalHeaderStyle).toHaveProperty('px', 4);
    expect(modalHeaderStyle).toHaveProperty('borderBottom');
  });

  test('exports modalBodyStyle with correct properties', () => {
    expect(modalBodyStyle).toBeDefined();
    expect(modalBodyStyle).toHaveProperty('p', 4);
    expect(modalBodyStyle).toHaveProperty('pt', 2);
    expect(modalBodyStyle).toHaveProperty('overflowY', 'auto');
    expect(modalBodyStyle).toHaveProperty('flex', 1);
  });

  test('exports modalFooterStyle with correct properties', () => {
    expect(modalFooterStyle).toBeDefined();
    expect(modalFooterStyle).toHaveProperty('display', 'flex');
    expect(modalFooterStyle).toHaveProperty('justifyContent', 'flex-end');
    expect(modalFooterStyle).toHaveProperty('flexShrink', 0);
  });

  test('all exported styles are objects', () => {
    expect(typeof modalBoxStyle).toBe('object');
    expect(typeof modalHeaderStyle).toBe('object');
    expect(typeof modalBodyStyle).toBe('object');
    expect(typeof modalFooterStyle).toBe('object');
  });
});