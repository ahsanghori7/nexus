import React from 'react';
import { goTo, getUrl } from 'v2/helpers/url';
import { Link as ReactLink } from 'react-router-dom';
import { StyledList, StyledListItem } from './styled';

const profileActions = [
  {
    id: 1,
    text: 'My profile',
    url: '/my-company/profile',
  },
  {
    id: 2,
    text: 'Change password',
    url: '/change-password',
  },
  {
    id: 3,
    text: 'Log out',
    handleClick: () => goTo(getUrl('prosper', '/logout')),
  },
];

const Content = () => (
  <StyledList>
    {profileActions.map((action) =>
      action.url ? (
        <ReactLink key={action.id} to={action.url}>
          <StyledListItem>{action.text}</StyledListItem>
        </ReactLink>
      ) : (
        <StyledListItem key={action.id} onClick={action.handleClick}>
          {action.text}
        </StyledListItem>
      )
    )}
  </StyledList>
);

export default Content;
