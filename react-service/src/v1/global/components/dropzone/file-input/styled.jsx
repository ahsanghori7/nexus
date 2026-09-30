import styled from 'styled-components';

const StyledFileInput = styled.input`
  top: 648px;
  left: 400px;
  width: 188px;
  height: 40px;
  background: #4cc0ad 0% 0% no-repeat padding-box;
  border-radius: 40px;
  opacity: 1;
  cursor: pointer;
  &::-webkit-file-upload-button {
    visibility: hidden;
  }
`;

const StyledFileInputContainer = styled.div`
  height: 40px;
  display: flex;
  align-items: center;
  margin-top: 15px;
  margin-left: -12px;
  width: 200px;
  background-color: #4cc0ad;
  border-radius: 40px;
  margin-left: 0.2rem;
  position: relative;
  svg {
    position: relative;
    left: 18px;
    color: #fff;
    opacity: 1;
  }
  input {
    opacity: 0;
    z-index: 1;
  }
  span {
    position: absolute;
    left: 38px;
    color: #fff;
    font-weight: bold;
    font-size: 1rem;
  }
`;

export default StyledFileInput;
export { StyledFileInputContainer };
