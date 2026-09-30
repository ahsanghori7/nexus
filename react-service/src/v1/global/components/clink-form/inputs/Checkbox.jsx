import React from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import { faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import SimpleTooltip from '../../SimpleTooltip';


const getIndex = (checkValues, value) => checkValues.indexOf(value);
const isChecked = (checkValues, value) => getIndex(checkValues, value) >= 0;

const Checkbox = ({
  options,
  field,
  setFieldValue,
  value,
  handleChange,
  className = '',
  toggleButton = true,
  tooltip = null,
  tooltipInfo = null,
  checkboxHidden = false,
  callback = () => null,
}) => {
  const checkClassName = toggleButton
    ? `${className} toggle-button`
    : className;
  const onChange = (opt) => () => {
    if (!checkboxHidden && !opt.disabled) {
      const values = value || [];
      if (!isChecked(value, opt.value)) {
        values.push(opt.value);
      } else {
        values.splice(getIndex(value, opt.value), 1);
      }
      setFieldValue(field.name, values);

      if (handleChange) {
        handleChange(field, opt, isChecked(value, opt.value));
      }
      if (callback) {
        callback({
          optValue: opt.value,
          val: isChecked(value, opt.value),
          fieldName: field.name,
        });
      }
    }
  };
  return (
    <ButtonGroup>
      {options.map((opt) => {
        let newComponentProps = {};
        if (tooltip) {
          const { componentProps } = tooltip;
          newComponentProps = { ...componentProps };
          delete newComponentProps.handleClick;
          if (componentProps && componentProps.handleClick) {
            newComponentProps.onClick = (event) => {
              event.preventDefault();
              componentProps.handleClick(opt.value);
            };
            if (opt.disabled) {
              newComponentProps.onClick = () => null;
            }
          }
          newComponentProps.className = `${newComponentProps.className} ${
            checkboxHidden ? 'no-checkbox' : ''
          }`;
          newComponentProps.disabled =
            opt.disabled || isChecked(value, opt.value);
        }
        const tooltipProps = {
          ...tooltip,
          componentProps: newComponentProps,
        };
        const [tooltipInfoEnabled, packageName] = (tooltipInfo &&
          tooltipInfo(opt.value)) || [false, ''];
        return (
          <ToggleButton
            id={opt.id}
            type="checkbox"
            key={opt.id}
            variant={
              isChecked(value, opt.value)
                ? 'outline-success'
                : 'outline-secondary'
            }
            disabled={opt.disabled}
            className={`clink-checkbox ${checkClassName}`}
            value={opt.value}
            checked={isChecked(value, opt.value)}
            onChange={onChange(opt)}
          >
            {Boolean(tooltipInfoEnabled) && (
              <>
                {' '}
                <Tooltip
                  title={`This trade is currently assigned to ${packageName}`}
                >
                  <InfoIcon className="info-icon-trade" />
                </Tooltip>
              </>
            )}
            &nbsp;
            <span>{opt.label}</span>
            &nbsp;
            {!checkboxHidden && (
              <FontAwesomeIcon
                className="icon-checkbox"
                icon={isChecked(value, opt.value) ? faCheckSquare : faSquare}
              />
            )}
            {tooltip && <SimpleTooltip {...tooltipProps} />}
          </ToggleButton>
        );
      })}
    </ButtonGroup>
  );
};

export default Checkbox;
