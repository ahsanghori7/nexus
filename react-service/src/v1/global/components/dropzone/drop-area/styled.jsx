import styled from 'styled-components';

const StyledDropArea = styled.div`
  min-height: 112px;
  border: 2px dashed #c6c5de;
  border-radius: 8px;
  opacity: 1;
  &.dropzone {
    cursor: pointer;
    &--uploading {
      border: 2px solid #4cc0ad;
      .dropzone__content {
        svg {
          z-index: 1;
        }
        &:after {
          background: rgba(76, 192, 173, 0.1);
          content: '\\A';
          height: inherit;
          position: absolute;
          left: 30px;
          width: ${(props) => props.barWidth || 0}%;
        }
      }
      .dropzone__copy {
        z-index: 1;
        &--second {
          text-decoration: none;
          color: #4cc0ad;
        }
      }
    }
    &--errors {
      border: 2px solid #ff7900;
      .dropzone__content {
        &:after {
          background: rgba(255, 121, 0, 0.1);
        }
      }
    }
  }
  .dropzone {
    &__content {
      background: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 112px;
      border-radius: 8px;
    }
    &__copy {
      margin-left: 24px;
      &--first,
      &--second,
      &--uploading {
        min-height: 17px;
        text-align: left;
        font-family: 'proxima_nova', 'sofia_pro_softlight', sans-serif;
        letter-spacing: 0px;
        font-weight: bold;
        margin-bottom: 0px;
      }
      &--first {
        min-width: 166px;
        color: #1a1b1f;
      }
      &--second {
        min-width: 126px;
        text-decoration: underline;
        color: #8e8dbe;
        .errors {
          margin-left: 20px;
          text-align: left;
          font-family: 'proxima_nova', 'sofia_pro_softlight', sans-serif;
          letter-spacing: 0px;
          color: #1a1b1f;
          opacity: 0.4;
          &--has-errors {
            color: #ff7900;
          }
        }
      }
      &--uploading {
        color: #1a1b1f;
        opacity: 0.5;
      }
    }
  }
`;

export default StyledDropArea;
