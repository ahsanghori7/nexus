import React from 'react';
import Typography from '@mui/material/Typography';
import { DEFAULT_MAX_SIZE_MB } from 'v2/helpers/files';

const AcceptedFilesList = () => (
  <div className="accepted-files-list">
    <p>
      Our system reads the documents, identifies the relevant trade packages for
      your project and distributes to each package accordingly.
    </p>
    <p>
      If you have any specification documents from the architect (e.g NBS)
      upload these in &#39;Architectural&#39;.
    </p>
    <Typography component="p">
      The file size should not exceed the maximum allowed limit of {DEFAULT_MAX_SIZE_MB}MB
    </Typography>
    <strong>Accepted files</strong>
    <ul>
      <li>- Images (.jpg .png)</li>
      <li>- Word (.doc .docx .docm .dotx)</li>
      <li>- Excel (.xls .xlsx .xlsm .xltx .xltm)</li>
      <li>- Adobe Acrobat (.pdf)</li>
      <li>- Text (.txt)</li>
      <li>- PowerPoint (.ppt .pptx .pps .ppsx .potm)</li>
      <li>- CAD (.dwg .dxf)</li>
    </ul>
  </div>
);

export default AcceptedFilesList;
