import React from 'react';

const actual = jest.requireActual('react-router-dom');

// Mock react-router-dom components
const Link = ({ children, to, component, ...props }) => {
  // If a component is provided, don't pass it as a prop to the rendered element
  if (component) {
    // Render the provided component without the component prop
    const { component: Component, ...filteredProps } = props;
    return React.createElement(component, { href: to, ...filteredProps }, children);
  }

  const href = typeof to === 'object' && to !== null ? to.pathname || '' : to;
  const state = typeof to === 'object' && to !== null ? to.state : undefined;

  // Default Link behavior
  return (
    <a href={href} data-state={state ? JSON.stringify(state) : undefined} {...props}>
      {children}
    </a>
  );
};

const BrowserRouter = ({ children }) => {
  return <div data-testid="mock-browser-router">{children}</div>;
};

const useNavigate = () => {
  return jest.fn();
};

const useLocation = () => ({
  pathname: '/mock-path',
  search: '',
  hash: '',
  state: null,
});

const useParams = () => ({
  slug: 'mock-slug',
});

module.exports = {
  ...actual,
  Link,
  BrowserRouter,
  useNavigate,
  useLocation,
  useParams,
};
