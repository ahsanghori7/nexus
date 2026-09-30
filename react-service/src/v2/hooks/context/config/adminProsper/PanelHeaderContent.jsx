import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import { InputCheckbox, InputText, Button } from 'clink-components';
import { useTranslation } from 'react-i18next';
import actions from 'store/reducers/actions';

const mapValue = {
  yes: true,
  no: false,
};
const PanelHeaderContent = ({
  approved: approvedProps = {},
  section,
  dispatch,
  aid,
}) => {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState(approvedProps.message);
  const [checked, setChecked] = useState(approvedProps.status);
  useEffect(() => {
    setChecked(approvedProps.status);
    setComment(approvedProps.message);
  }, [approvedProps]);
  const { t } = useTranslation();
  const dispatchChangeStatus = (value) =>
    dispatch(
      actions.admin.changeSectionStatus({
        value: mapValue[value],
        section,
      })
    );
  const handleCheckChange = (e) => {
    const { value } = e.target;
    dispatchChangeStatus(value);
  };
  const handleCommentChange = (e) => {
    const { value } = e.target;
    setComment(value);
  };
  const handleSubmit = () => {
    if (aid) {
      setLoading(true);
      dispatch(
        actions.admin.postStatus({
          aid,
          body: {
            sections: [
              {
                id: approvedProps.id,
                status: checked,
                message: comment,
              },
            ],
          },
        })
      ).then(() => setLoading(false));
    }
  };
  const value = checked ? t('yes').toLowerCase() : t('no').toLowerCase();
  const disabled =
    (!comment && !checked) || (!checked && comment && !comment.length);

  return (
    <>
      <div className="pegasus-checkbox-wrapper">
        {loading && <CircularProgress className="loading-status" />}
        <InputCheckbox
          autoComplete="approved"
          label={`${t('approved')}?`}
          errors={{}}
          placeholder="PLACEHOLDER"
          name="approved"
          type="radio"
          value={value}
          onChange={handleCheckChange}
          rules={{}}
          options={[
            {
              label: t('yes'),
              value: t('yes').toLowerCase(),
            },
            {
              label: t('no'),
              value: t('no').toLowerCase(),
            },
          ]}
        />
      </div>
      <div className="add-comment">
        {!checked && (
          <InputText
            autoComplete="comment"
            inputValue={comment}
            name="comment"
            type="text"
            placeholder={t('add-comment')}
            onChange={handleCommentChange}
          />
        )}
        <Button
          className="comment-activated"
          color="green"
          sizeBtn="normal"
          layout="square"
          disabled={disabled}
          handleClick={handleSubmit}
          label="Submit"
        />
      </div>
    </>
  );
};
const PanelHeaderContentRedux = connect()(PanelHeaderContent);
export default PanelHeaderContentRedux;
