import React from 'react';
import { StyledHeader } from './styled';

const Header = ({ title, children }) => (
  <StyledHeader>
    {title}
    {children}
  </StyledHeader>
);

export default Header;
