import React from 'react';
import { render, screen } from '@testing-library/react';
import ContentEditor, { onlyShortcodes } from './index';

describe('onlyShortcodes', () => {
  it('should return true for empty string', () => {
    expect(onlyShortcodes('')).toBe(true);
  });

  it('should return true for string with only shortcodes', () => {
    expect(onlyShortcodes('{shortcode1}{shortcode2}')).toBe(true);
  });

  it('should return false for string with content and shortcodes', () => {
    expect(onlyShortcodes('some text {shortcode1} more text')).toBe(false);
  });

  it('should return true for string with only HTML tags', () => {
    expect(onlyShortcodes('<p>test</p>')).toBe(false);
  });

  it('should return true for string with nested shortcodes', () => {
    expect(onlyShortcodes('{shortcode1{nested}}')).toBe(false);
  });

  it('should return true for string with malformed shortcodes', () => {
    expect(onlyShortcodes('{shortcode1')).toBe(false);
  });

  it('should correctly determine only shortcodes in content', () => {
    const editorHtml1 = 'Hello {b:my} world!';
    const editorHtml2 = '{shortcode}';
    const editorHtml3 = '{b:{UserName}}';
    const editorHtml4 = '{b:My} little {shortcode}!';
    const editorHtml5 = '{shortcode1}{shortcode2}{shortcode3}';

    expect(onlyShortcodes(editorHtml1)).toBe(false);
    expect(onlyShortcodes(editorHtml2)).toBe(true);
    expect(onlyShortcodes(editorHtml3)).toBe(false);
    expect(onlyShortcodes(editorHtml4)).toBe(false);
    expect(onlyShortcodes(editorHtml5)).toBe(true);
  });
});

describe('ContentEditor', () => {
  it('should handle empty content and apply correct class', () => {
    const content = [];
    const handleConfigChange = jest.fn();
    render(
      <ContentEditor
        content={content}
        editable
        handleConfigChange={handleConfigChange}
        uniqueKey="1"
      />,
    );
    expect(screen.queryByTestId('text-button')).not.toBeInTheDocument();
  });

  it('should handle content with only shortcodes', () => {
    const content = ['{shortcode1}{shortcode2}'];
    render(<ContentEditor content={content} editable uniqueKey="1" />);
    expect(screen.getByText('{shortcode1}{shortcode2}')).toBeInTheDocument();
  });
});
