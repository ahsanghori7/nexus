import styled from 'styled-components';

const Container = styled.div`
  height: 3rem;
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid #c6c5de;
  margin-bottom: 1rem;
  width: 100%;
`;

const Title = styled.div`
  flex: auto;
`;

const ProgressBarContainer = styled.div`
  max-width: 150px;
  padding: 3px 0.8rem 3px 0.8rem;
  height: 95%;
  border-radius: 3rem;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #f3f3f8;
  border: 1px solid #c6c5de;
`;

const ProgressBar = styled.div`
  background: #4cc0ad;
  width: ${({ percent }) => percent}%;
  border-radius: 3rem 0 0 3rem;
  overflow: hidden;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  transition: width 0.5s ease-in-out;
`;

const ProgressText = styled.div`
  position: absolute;
  top: 2px;
  left: 0;
  z-index: 999;
  width: 100%;
  text-align: center;
`;

export { Container, Title, ProgressBar, ProgressText, ProgressBarContainer };
