import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { SM_SCREEN } = CONSTANTS.dimensions;
const {
  prosperBoxRed: prosperRed,
  prosperGrayBorder,
  prosperBoxGreen,
} = CONSTANTS.colors.prosper;
const { clinkRed, japaneseIndigo, white } = CONSTANTS.colors.general;

const StyledForgotPassword = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  flex-direction: column;

  .clink-form {
    min-height: 380px;
    min-width: 300px;
    max-width: 500px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: ${white};
    border-radius: 6px;
    border: 1px solid ${prosperGrayBorder};

    @media (max-width: ${SM_SCREEN - 1}px) {
      box-sizing: border-box;
    }

    .clink-form__input {
      width: 100%;
      max-width: 360px;

      .clink-form__error {
        font-size: 14px;
        margin-top: 6px;
      }

      label {
        color: ${japaneseIndigo};
        position: relative;
        font-size: 16px;
        margin-bottom: 14px;

        &:after {
          content: '*';
          color: ${clinkRed};
          padding-left: 4px;
        }
      }

      input {
        font-size: 18px;
        height: 62px;

        &::placeholder {
          font-size: 18px;
          font-weight: normal;
        }
      }
    }

    button {
      margin-top: 40px;
      font-size: 19px;
      padding: 18px 36px;
      background-color: ${prosperRed};
    }
  }
`;

const StyledForgotPasswordMessage = styled.div`
  margin-bottom: 40px;
  font-size: 23px;
  max-width: 540px;
  line-height: 1.5;
  color: ${(props) => (props.color ? `${props.color}` : `${prosperBoxGreen}`)};
  text-align: center;
`;

const StyledForgotPasswordTitle = styled.div`
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 40px;
  color: ${japaneseIndigo};
  text-align: center;
`;

const StyledForgotPasswordLogo = styled.div`
  max-width: 270px;
  width: 100%;
  margin-bottom: 40px;

  span {
    width: 100%;
    img {
      width: 100%;
    }
  }
`;

export {
  StyledForgotPassword,
  StyledForgotPasswordLogo,
  StyledForgotPasswordMessage,
  StyledForgotPasswordTitle,
};
