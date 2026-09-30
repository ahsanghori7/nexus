import React, { useEffect } from 'react';

function useResizeObserver(className, callback) {
  useEffect(() => {
    const elements = document.getElementsByClassName(className);
    const observedElement = elements.length > 0 ? elements[0] : null;

    if (!observedElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        callback(entry.contentRect);
      }
    });

    resizeObserver.observe(observedElement);

    // eslint-disable-next-line consistent-return
    return () => resizeObserver.unobserve(observedElement);
  }, [className, callback]);
}

export default useResizeObserver;
