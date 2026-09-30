import React from 'react';
import { StyledItem } from './Dashboard.styled';
import StyledH2 from './StyledH2.styled';

const Layout = ({ config = [] }) => {
  return config.map((item) => {
    const [keyIndex] = Object.keys(item.key);
    return (
      <StyledItem key={keyIndex} {...item.key}>
        <StyledH2>{item.title}</StyledH2>
        {item.content}
      </StyledItem>
    );
  });
};

export default Layout;
