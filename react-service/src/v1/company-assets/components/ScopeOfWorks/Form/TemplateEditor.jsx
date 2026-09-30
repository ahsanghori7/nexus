import React from 'react';
import Editor from '../../../../global/components/clink-form/inputs/editor';
import Table from '../../Table';

const TemplateEditor = ({ sow, updateTemplate }) => {
  const valueEditor = {
    editorHtml:
      sow && sow.content && sow.content.content ? sow.content.content : '',
  };

  const handleOnChange = (value) => {
    updateTemplate(value);
  };

  return (
    <Table title="Edit the Scope of Works template">
        <div className="scope-of-works">
          <Editor
            value={valueEditor}
            placeholder="Enter Scope of works description"
            attachment={false}
            customOnChange={handleOnChange}
            companyAssets
          />
        </div>
      </Table>
  );
};

export default TemplateEditor;
