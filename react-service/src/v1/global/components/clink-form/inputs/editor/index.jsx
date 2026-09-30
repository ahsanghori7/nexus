import React from 'react';
import flag from 'v2/helpers/flags';
import ReactDOMServer from 'react-dom/server';
import isNil from 'lodash/isNil';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import Toolbar from './Toolbar';
import AttachmentFiles from './AttachmentFiles';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

const IMG_TAGS = ['IMG'];
const BLOCKED_TAGS = ['DIV', 'SPAN', 'P', 'B', 'STRONG'];
class Editor extends React.PureComponent {
  constructor(props) {
    super(props);
    const { value } = props;
    const { editorHtml, files } = value;
    this.state = {
      editorHtml: isNil(editorHtml) ? '' : editorHtml,
      files: isNil(files) ? [] : files,
    };
    this.handleOnChangeEditor = this.handleOnChangeEditor.bind(this);
    this.handleOnFileChange = this.handleOnFileChange.bind(this);
    this.modules = this.modules.bind(this);
    this.send = this.send.bind(this);
    this.attachment = this.attachment.bind(this);
    this.removeFile = this.removeFile.bind(this);
    this.handlePasteAnywhere = this.handlePasteAnywhere.bind(this);
    this.configQuillPasteOptions = this.configQuillPasteOptions.bind(this);
    this.updateSetFieldValue = this.updateSetFieldValue.bind(this);
    this.inputFile = React.createRef();
    this.quillRef = React.createRef();
    // Safe access to Quill icons - add this try/catch
    try {
      const icons = ReactQuill.Quill.import('ui/icons');
      icons.bold = ReactDOMServer.renderToString(<FormatBoldIcon />);
      icons.italic = ReactDOMServer.renderToString(<FormatItalicIcon />);
      icons.underline = ReactDOMServer.renderToString(<FormatUnderlinedIcon />);

      // Create list object if it doesn't exist
      if (!icons.list) {
        icons.list = {};
      }

      icons.list.bullet = ReactDOMServer.renderToString(
        <FormatListBulletedIcon />,
      );
      icons.list.ordered = ReactDOMServer.renderToString(
        <FormatListNumberedIcon />,
      );
    } catch (error) {
      // Ignore errors in test environment
      // eslint-disable-next-line no-console
      console.log('Skipping Quill icon setup in test environment');
    }
  }

  componentDidMount() {
    if (flag('DC_EDITOR_FIX')) {
      this.configQuillPasteOptions();
    } else {
      window.addEventListener('paste', this.handlePasteAnywhere);
    }

    // Initialize with content if available
    const { value } = this.props;
    const { editorHtml } = value || {};

    if (editorHtml && this.quillRef.current) {
      const quill = this.quillRef.current.getEditor();
      // Wait for Quill to initialize fully
      setTimeout(() => {
        quill.clipboard.dangerouslyPasteHTML(0, editorHtml);
      }, 50);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('paste', this.handlePasteAnywhere);
  }

  handlePasteAnywhere() {
    const { companyAssets, docCreator } = this.props;
    if (docCreator || companyAssets) {
      event.preventDefault();
      this.handleOnChangeEditor(event.clipboardData.getData('text'));
    }
  }

  static getDerivedStateFromProps(props, state) {
    const { value, docCreator, docCreatorLoading } = props;
    const { editorHtml: editorHtmlProps } = value;
    const { editorHtml: editorHtmlState } = state;
    if (
      docCreator &&
      docCreatorLoading &&
      editorHtmlProps !== editorHtmlState
    ) {
      return { editorHtml: editorHtmlProps };
    }
    // Return null to indicate no change to state.
    return null;
  }

  handleOnChangeEditor(html) {
    const { files } = this.state;
    const { customOnChange } = this.props;
    const value = html;
    const callback = customOnChange
      ? () => customOnChange(value, files)
      : () => this.updateSetFieldValue(value, files);
    this.setState({ editorHtml: value }, callback);
  }

  handleOnFileChange(event) {
    const { editorHtml, files: stateFiles } = this.state;
    const { files: inputFiles } = event.target;
    const newFiles = stateFiles.slice();
    Array.from(inputFiles).forEach((file) => {
      if (!newFiles.filter((f) => f.name === file.name).length) {
        newFiles.push(file);
      }
    });
    this.setState({ files: newFiles }, () => {
      this.updateSetFieldValue(editorHtml, newFiles);
      this.inputFile.current.value = '';
    });
  }

  // Update your configQuillPasteOptions method in the Editor component:
  configQuillPasteOptions() {
    const { companyAssets, docCreator } = this.props;
    if (docCreator || companyAssets) {
      const { current } = this.quillRef;
      // Add safety check for current and current.editor
      if (current && current.editor) {
        current.editor.clipboard.addMatcher(
          Node.ELEMENT_NODE,
          (node, delta) => {
            const ops = [];
            delta.ops.forEach((op) => {
              let newOp = op;
              if (
                op.insert &&
                typeof op.insert === 'string' &&
                BLOCKED_TAGS.includes(node.tagName)
              ) {
                newOp = {
                  ...op,
                  insert: op.insert,
                };
              }
              if (!IMG_TAGS.includes(node.tagName)) {
                ops.push(newOp);
              }
            });
            delta.ops = ops;
            return delta;
          },
        );
      }
    }
  }

  modules() {
    return {
      toolbar: {
        container: '#toolbar',
        handlers: {
          send: this.send,
          attachment: this.attachment,
        },
      },
    };
  }

  send() {
    const { editorHtml, files } = this.state;
    const { isReadyToSend, sendCallback } = this.props;

    if (isReadyToSend()) {
      this.setState({ editorHtml: '', files: [] }, () => {
        sendCallback(editorHtml, files);
      });
    }
  }

  attachment() {
    this.inputFile.current.click();
  }

  removeFile(name) {
    const { files } = this.state;
    const newFiles = files.filter((filter) => filter.name !== name);
    this.setState({ files: newFiles });
  }

  updateSetFieldValue(editorHtml, files) {
    const { name, setFieldValue } = this.props;
    if (!isNil(setFieldValue)) {
      setFieldValue(name, { editorHtml, files });
    }
  }

  render() {
    const { editorHtml, files } = this.state;
    const {
      topToolbar,
      placeholder,
      sendCallback,
      loadingSendMessage,
      attachment,
      bold,
      italic,
      underline,
      ordered,
      bullet,
      onBlur,
      onFocus,
    } = this.props;
    const handleBlur = onBlur || (() => null);
    const handleFocus = onFocus || (() => null);
    return (
      <div className="text-editor">
        {topToolbar && (
          <Toolbar
            sendCallback={sendCallback}
            message={editorHtml}
            loadingSendMessage={loadingSendMessage}
            attachment={attachment}
            bold={bold}
            italic={italic}
            underline={underline}
            ordered={ordered}
            bullet={bullet}
          />
        )}
        <ReactQuill
          ref={this.quillRef}
          onChange={this.handleOnChangeEditor}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={topToolbar ? 'top-toolbar' : 'bottom-toolbar'}
          placeholder={placeholder}
          value={editorHtml || ''}
          modules={this.modules()}
        />
        {Boolean(files.length) && (
          <AttachmentFiles
            className={topToolbar ? 'top-toolbar' : 'bottom-toolbar'}
            files={files}
            removeFile={this.removeFile}
          />
        )}
        <input
          type="file"
          ref={this.inputFile}
          onChange={this.handleOnFileChange}
          style={{ display: 'none' }}
          multiple
        />
        {!topToolbar && (
          <Toolbar
            sendCallback={sendCallback}
            message={editorHtml}
            loadingSendMessage={loadingSendMessage}
          />
        )}
      </div>
    );
  }
}

Editor.defaultProps = {
  value: {},
  placeholder: '',
  topToolbar: true,
  attachment: true,
  bold: true,
  italic: true,
  underline: true,
  ordered: true,
  bullet: true,
  customOnChange: null,
};

Editor.propTypes = {
  value: PropTypes.object,
  placeholder: PropTypes.string,
  topToolbar: PropTypes.bool,
  attachment: PropTypes.bool,
  bold: PropTypes.bool,
  italic: PropTypes.bool,
  underline: PropTypes.bool,
  ordered: PropTypes.bool,
  bullet: PropTypes.bool,
  customOnChange: PropTypes.func,
};

export default Editor;
