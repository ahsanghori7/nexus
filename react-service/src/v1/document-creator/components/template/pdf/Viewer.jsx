import React from 'react';

const Viewer = ({ children, pdfViewerRef, heightDocument }) => {
  const props = {};
  const className = 'PDFViewer';
  return (
    <div
      {...props}
      className={className}
      ref={pdfViewerRef}
      style={{ height: heightDocument }}
    >
      {children}
    </div>
  );
};

export default Viewer;
