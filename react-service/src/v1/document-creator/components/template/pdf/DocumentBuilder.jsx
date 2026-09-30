import React from 'react';
import DocumentBuilder from '../../../services/document-builder';

class DocumentBuilderComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    const { handleConfigChange } = props;
    this.documentBuilder = new DocumentBuilder(handleConfigChange);
  }

  render() {
    const {
      config,
      shortcodes,
      inputFocused,
      inputRef,
      vat,
      handleUpdateAttendance,
      handleLocalMiniBoq,
      handleUpdateVat,
      formValues,
      formFields,
    } = this.props;
    this.documentBuilder.formFields = formFields || [];
    return (
      this.documentBuilder &&
      this.documentBuilder.build(
        config,
        shortcodes,
        inputFocused,
        inputRef,
        vat,
        formValues,
        handleUpdateAttendance,
        handleLocalMiniBoq,
        handleUpdateVat,
      )
    );
  }
}

export default DocumentBuilderComponent;
