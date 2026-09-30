import React from 'react';
import ReactDOMServer from 'react-dom/server';
import isEmpty from 'lodash/isEmpty';
import Modal from 'v1/global/components/modal';
import { TextButton } from 'v1/global/components/general-ui/Buttons';
import Config from 'v1/document-creator/helpers/config';
import EditorManager from './EditorManager';

function onlyShortcodes(editorHtml) {
  // Remove content enclosed in curly braces, avoiding nested or malformed braces
  const removeShortcodes = editorHtml.replace(/{[^{}]*}/gm, '');

  // Remove remaining brackets (square and curly)
  const removeBrackets = removeShortcodes.replace(/[{}]/g, '');

  // Remove HTML tags
  const removeBreaks = removeBrackets.replace(/<[^<>]+>/g, '');

  const contentWithNoShortcodes = removeBreaks.replace(/<\/[^<>]+>/g, '');
  return isEmpty(contentWithNoShortcodes);
}

const ContentEditor = ({
  content,
  editable,
  handleConfigChange,
  uniqueKey,
  disableInlineEdit = false,
  tooltipLabel = '',
}) => {
  if (!editable) {
    return content;
  }
  let editorHtml = content.map(ReactDOMServer.renderToString).join('');

  if (editorHtml && onlyShortcodes(editorHtml)) {
    return content;
  }

  if (disableInlineEdit) {
    return (
      <span
        className="sow-managed-content"
        {...(tooltipLabel ? { title: tooltipLabel } : {})}
      >
        {content}
      </span>
    );
  }

  // We prepare button for opening the Text Editor modal
  const filteredContent = content.filter(
    (contentItem) =>
      typeof contentItem !== 'object' ||
      (typeof contentItem === 'object' &&
        (contentItem?.type === 'br' ||
          contentItem?.type === 'hr' ||
          contentItem?.type === 'strong' ||
          contentItem?.type === 'u' ||
          contentItem?.type === 'del' ||
          contentItem?.type === 'em' ||
          contentItem?.type === 'mark' ||
          contentItem?.type === 'ul' ||
          contentItem?.type === 'ol' ||
          contentItem?.type === 'li')),
  );

  // if pattern is NDxx - NDxxx (isKeyword) and is alone in string (trimmed) make it clickable
  const text = (filteredContent || '').toString().trim();

  const isND = /^ND\d{1,3}$/.test(text);
  const isKeyword = ['HRB', 'SCM'].includes(text);

  if (isND || isKeyword) {
    return (
      <a
        href={`#${text}`}
        onClick={(e) => {
          e.preventDefault();
          const el = document.querySelector(`.${text}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      >
        {filteredContent}
      </a>
    );
  }

  editorHtml = Config.cleanHtml(editorHtml);
  const buttonClassname = editorHtml ? '' : 'text-button--empty';
  // eslint-disable-next-line react/no-unstable-nested-components
  const OpenButton = ({ handleClick }) => (
    <TextButton handleClick={handleClick} className={buttonClassname}>
      {filteredContent}
    </TextButton>
  );
  return (
    <Modal
      key={`${uniqueKey}-modal`}
      title="Edit Document Text"
      showClose={false}
      className="document-creator-modal document-creator-modal__edit-content"
      subtitle="Edit fixed wording in the document layout. To change Description of Works/Services, use the field in the left panel."
      ShowButton={OpenButton}
      render={(modalProps) => {
        const { setShow } = modalProps;
        const value = { editorHtml };
        return (
          <EditorManager
            value={value}
            setShow={setShow}
            handleConfigChange={handleConfigChange}
          />
        );
      }}
    />
  );
};

export default ContentEditor;
export { onlyShortcodes };
