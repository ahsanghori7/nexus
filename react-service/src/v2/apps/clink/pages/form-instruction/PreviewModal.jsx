import React, { useState, useEffect } from 'react';
import { Modal, Button, CONSTANTS, HOOKS, Loader } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { getPreviewLink } from 'v2/apps/clink/helpers';

const { dimensions: dimensionsValues } = CONSTANTS;
const { useWindowDimensions } = HOOKS;
const PreviewModal = ({
  id,
  type,
  disabledPreview = false,
  setOpenPreview,
  openPreview,
  refSave = null,
}) => {
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState('660px');
  const dimensions = useWindowDimensions();
  const { t } = useTranslation();
  useEffect(() => {
    let newWidth = '660px';
    if (dimensions.width < dimensionsValues.MD_SCREEN) {
      newWidth = `${dimensionsValues.MD_SCREEN - 170}px`;
    }
    if (dimensions.width < dimensionsValues.SM_SCREEN) {
      newWidth = `${dimensionsValues.SM_SCREEN - 250}px`;
    }
    if (newWidth !== width) {
      setWidth(newWidth);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions]);

  const url = getPreviewLink(type, id);

  return (
    <Modal
      className="preview-modal"
      externalOpen={openPreview}
      openElement={
        <div>
          <Button
            disabled={disabledPreview}
            handleClick={(e) => {
              e.preventDefault();
              if (refSave) {
                refSave.current.click();
                setOpenPreview(true);
              }
            }}
            label={t('preview')}
          />
        </div>
      }
      onHidden={() => {
        setLoading(true);
        setOpenPreview(false);
      }}
      render={() => (
        <>
          {loading && <Loader fullDiv />}
          <iframe
            title={t('preview')}
            src={url}
            width={width}
            height="93%"
            loading="lazy"
            onLoad={() => setLoading(false)}
            frameBorder="0"
            marginHeight="0"
            marginWidth="0"
          />
        </>
      )}
    />
  );
};

export default PreviewModal;
