import React, { useState, useMemo } from 'react';
import SendQuote, { TENDER_RECEIVED_ID } from './send-quote';
import StartBOQ from './StartBOQ';
import CommonModal from './CommonModal';
import { Button, Image, CONSTANTS } from 'clink-components';
import ActionsButton from './send-quote/ActionButton';
import { StyledActionButtonText } from './send-quote/form/styled';

const { iconQuoteBlack } = CONSTANTS.s3;

const RenderModal = React.memo(({ step, hasBoq, ...props }) => {
  const { modalProps, setStep } = props;

  const modalContent = useMemo(() => {
    if (!hasBoq) {
      return <SendQuote {...props} {...modalProps} />;
    }
    return step ? (
      <SendQuote {...props} {...modalProps} />
    ) : (
      <StartBOQ {...props} {...modalProps} setStep={setStep} />
    );
  }, [step, hasBoq, props, modalProps, setStep]);

  return modalContent;
});

const EnquiryModal = (props) => {
  const {
    action = { text: '' },
    enquiry = { package: '', project: '', document: {} },
    externalOpen = false,
    hideDefaultOpenModalContent = false,
    onHidden = null,
  } = props;
  const flagBoq = enquiry?.document?.enquiry?.has_boq;

  const [step, setStep] = useState(flagBoq ? 0 : 1);

  if (Number(enquiry.status_id) !== TENDER_RECEIVED_ID) {
    return (
      <ActionsButton
        className="actions-send"
        imgSrc={iconQuoteBlack}
        text={action.text}
        disabled
      />
    );
  }

  const openElement = (
    <Button data-testid="enquiry-modal-open-btn" className="actions-send">
      <Image src={iconQuoteBlack} />
      <StyledActionButtonText width={60}>{action.text}</StyledActionButtonText>
    </Button>
  );
  return (
    <CommonModal
      externalOpen={externalOpen}
      openElement={hideDefaultOpenModalContent ? null : openElement}
      onHidden={onHidden}
      className="proper-enquiry-sidemodal"
      renderModal={(modalProps) => (
        <RenderModal
          {...props}
          modalProps={modalProps}
          setStep={setStep}
          hasBoq={flagBoq}
          step={step}
        />
      )}
    />
  );
};

export default EnquiryModal;
export { TENDER_RECEIVED_ID };
