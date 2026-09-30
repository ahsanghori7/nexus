const React = require('react');

module.exports = {
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
    version: 'mock-version',
  },
  Document: ({ children, onLoadSuccess }) => {
    const [loaded, setLoaded] = React.useState(false);
    React.useEffect(() => {
      const timer = setTimeout(() => {
        if (onLoadSuccess) onLoadSuccess({ numPages: 10 });
        setLoaded(true);
      }, 10);
      return () => clearTimeout(timer);
    }, [onLoadSuccess]);
    return React.createElement('div', { 'data-testid': 'pdf-document' }, loaded ? children : null);
  },
  Page: ({ pageNumber, scale, onLoadSuccess }) => {
    React.useEffect(() => {
      if (onLoadSuccess) {
        setTimeout(() => onLoadSuccess({ width: 800, height: 1200 }), 10);
      }
    }, [onLoadSuccess]);
    return React.createElement('div', { 'data-testid': 'pdf-page', 'data-page-number': pageNumber });
  },
};
