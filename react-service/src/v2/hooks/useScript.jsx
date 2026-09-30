import { useEffect } from 'react';

const useScript = (url) => {
  useEffect(() => {
    const script = document.createElement('script');

    script.src = url;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      // Check if script is still in the DOM before trying to remove it
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [url]);
};

export default useScript;
