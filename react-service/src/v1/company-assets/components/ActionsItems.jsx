import React from 'react';

const ActionsItems = ({ items = [], children }) => (
  <div className="actions-order">
    {children ||
      items.map((item) => (
        <div key={item.id} className="action-item">
          {item.tooltip && (
            <div className="action-tooltip tooltip-view">{item.tooltip}</div>
          )}
          {item.content}
        </div>
      ))}
  </div>
);

export default ActionsItems;
