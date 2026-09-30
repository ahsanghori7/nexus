import React from 'react';

const SwitchBox = ({ name, label, value, register, onChange, ...props }) => {
  const registerResult = register ? register(name) : {};

  return (
    <div data-testid="switchbox" className="switchbox-container">
      <div className="switchbox-wrapper">
        <input
          type="checkbox"
          data-testid="switch"
          defaultChecked={value}
          onChange={onChange}
          {...registerResult}
          {...props}
        />
        {label && (
          <label data-testid="switchbox-label">
            {label}
          </label>
        )}
      </div>
    </div>
  );
};

export default SwitchBox;
