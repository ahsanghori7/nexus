function useClarity(callback = () => null) {
  /* eslint-disable react-hooks/rules-of-hooks*/
  if (CLARITY && CLARITY.PROJECT_ID) {
    let envs = ['production'];
    if (CLARITY.DEBUG) {
      envs = ['staging', 'uat', 'production'];
    }
    if (ENV && envs.includes(ENV)) {
      try {
        (function (c, l, a, r, i, t, y) {
          c[a] =
            c[a] ||
            function () {
              // eslint-disable-next-line prefer-rest-params
              (c[a].q = c[a].q || []).push(arguments);
            };
          t = l.createElement(r);
          t.async = 1;
          t.src = 'https://www.clarity.ms/tag/' + i;
          y = l.getElementsByTagName(r)[0];
          y.parentNode.insertBefore(t, y);
        })(window, document, 'clarity', 'script', CLARITY.PROJECT_ID);
        callback();
      } catch (e) {
        if (CLARITY.DEBUG) {
          console.error('Clarity load error');
          console.error(e);
        }
      }
    }
  }
}

export default useClarity;
