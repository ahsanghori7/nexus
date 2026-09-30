import { render } from '@testing-library/react';
import htmlParser, { MAX_HTML_TAG_OPT_SIZE } from './htmlParser';

describe('htmlParser', () => {
  it('renders <b> tag correctly', () => {
    const { container } = render(htmlParser.b('Bold text'));
    expect(container.innerHTML).toContain('<strong>Bold text</strong>');
  });

  it('renders <bred> tag with class "red"', () => {
    const { container } = render(htmlParser.bred('Red text'));
    expect(container.innerHTML).toContain(
      '<strong class="red">Red text</strong>'
    );
  });

  it('renders <u> tag correctly', () => {
    const { container } = render(htmlParser.u('Underlined text'));
    expect(container.innerHTML).toContain('<u>Underlined text</u>');
  });

  it('renders <br> tag correctly', () => {
    const { container } = render(htmlParser.br());
    expect(container.innerHTML).toContain('<br');
  });

  it('checks MAX_HTML_TAG_OPT_SIZE constant', () => {
    expect(MAX_HTML_TAG_OPT_SIZE).toBe(6);
  });

  it('generates keys using keyGenerator', () => {
    const key1 = htmlParser.br().key;
    const key2 = htmlParser.u('test').key;
    expect(key1).not.toEqual(key2);
  });
});
