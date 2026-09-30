import React from 'react';
import {
  faTimesCircle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const GoTo = ({ link = 'http://www.example.com/', page = 'example' }) => (
  <a href={link}>
    <FontAwesomeIcon icon={faCheckCircle} /> Go to {page}
  </a>
);

const Notification = ({ children, notification }) => (
  <li className={`feed-item ${notification.status}`}>
    <div className="feed-item-list">
      <span className="date">{notification.date}</span>
      <span className="activity-text">{children}</span>
      <GoTo link={notification.link} page={notification.page} />
    </div>
    <a href="#" className="dismiss">
      <FontAwesomeIcon icon={faTimesCircle} />
    </a>
  </li>
);

export { Notification, GoTo };
