import React, { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import Quill from 'quill';
import { parseHtmlToDelta } from './helpers'; // Our helper function
import getContent from 'v1/document-creator/services/document-builder/getContent';
import Config from 'v1/document-creator/helpers/config';

// Editor is an uncontrolled React component
const Editor = forwardRef(
  (
    {
      readOnly,
      defaultValue,
      onTextChange = () => null,
      onSelectionChange = () => null,
    },
    ref,
  ) => {
    const containerRef = useRef(null);
    const onTextChangeRef = useRef(onTextChange);
    const onSelectionChangeRef = useRef(onSelectionChange);

    useLayoutEffect(() => {
      onTextChangeRef.current = onTextChange;
      onSelectionChangeRef.current = onSelectionChange;
    });

    useEffect(() => {
      ref.current?.enable(!readOnly);
    }, [ref, readOnly]);

    useEffect(() => {
      const container = containerRef.current;
      const editorContainer = container.appendChild(
        container.ownerDocument.createElement('div'),
      );
      // TODO: To investigate a fancy way to enable options
      const toolbarOptions = [
        ['bold', 'italic', 'underline'], // toggled buttons
        // ['bold', 'italic', 'underline', 'strike'], // full toggled buttons
        // ['blockquote', 'code-block'],
        // ['link', 'image', 'video', 'formula'],

        // [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ list: 'ordered' }, { list: 'bullet' }],
        // [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }], // full list of options
        // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        // [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        // [{ 'direction': 'rtl' }],                         // text direction

        // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        // [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        // [{ 'font': [] }],
        // [{ 'align': [] }],

        // ['clean']                                         // remove formatting button
      ];
      const quill = new Quill(editorContainer, {
        theme: 'snow',
        modules: {
          toolbar: toolbarOptions,
        },
      });

      ref.current = quill;

      if (defaultValue) {
        const defVal = Config.hasHtmlCode(defaultValue)
          ? Config.cleanHtml(
              ReactDOMServer.renderToStaticMarkup(getContent(defaultValue)),
            )
          : defaultValue;
        quill.setContents(parseHtmlToDelta(defVal));
      }

      quill.on(Quill.events.TEXT_CHANGE, (...args) => {
        onTextChangeRef.current?.(...args);
      });

      quill.on(Quill.events.SELECTION_CHANGE, (...args) => {
        onSelectionChangeRef.current?.(...args);
      });

      return () => {
        ref.current = null;
        container.innerHTML = '';
      };
    }, [ref, defaultValue]);

    return <div ref={containerRef} />;
  },
);

Editor.displayName = 'Editor';

export default Editor;
