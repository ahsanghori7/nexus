import React from 'react';

const MenuButton = ({ name = '...', number = '0' }) => (
  <li className="nav-item">
    <a href="#" className="nav-link">
      <p>{name}</p>
      <span className="badge">{number}</span>
    </a>
  </li>
);

export default MenuButton;
