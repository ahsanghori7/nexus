// __mocks__/@mui/icons-material/Article.js
import * as React from 'react';

const Article = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    'data-testid': 'article-icon',
    ...props,
    ref,
  });
});
Article.displayName = 'Article';
module.exports = Article;
