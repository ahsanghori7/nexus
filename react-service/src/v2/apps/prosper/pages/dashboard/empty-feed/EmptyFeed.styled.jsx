import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { azureishWhite3, azureishWhite4, lightBlue } = CONSTANTS.colors.prosper;
const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { LG_SCREEN } = CONSTANTS.dimensions;

const StyledFeed = styled.div`
  padding: 51px 68px 14px;
  background-color: ${azureishWhite3};
  opacity: 1;
  max-height: 617px;
  min-height: 617px;
  border: 1px solid ${azureishWhite4};
  border-radius: 5px;
  @media (max-width: ${LG_SCREEN - 1}px) {
    max-height: 475px;
    min-height: 475px;
    padding: 25px;
  }
`;

const StyledFeedElement = styled.div`
  text-align: center;
  font-family: ${avantGardeGothicPRO};
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: ${lightBlue};
  opacity: 1;
  @media (max-width: ${LG_SCREEN - 1}px) {
    font-size: 15px;
  }
  ${(p) =>
    p.small
      ? `
	  font-size: 15px;
	  @media (max-width: ${LG_SCREEN - 1}px) {
	    font-size: 12px;
	  }
	  font-weight: 400;
	  letter-spacing: -0.17px;
	`
      : ''}
  ${(p) =>
    p.second
      ? `
	  margin-top: 35px;
	  @media (max-width: ${LG_SCREEN - 1}px) {
		  img {
		    width: 100px;
		  }
	  }
	`
      : ''}
	${(p) =>
    p.third
      ? `
	  margin-top: 45px;
	`
      : ''}
	${(p) =>
    p.fourth
      ? `
	  margin-top: 56px;
	  @media (max-width: ${LG_SCREEN - 1}px) {
		  img {
	      height: 90px;
	    }
	  }
	`
      : ''}
	${(p) =>
    p.fifth
      ? `
	  margin-top: 63px;
	  button {
	    border-radius: 5px;
	    font-size: 17px;
	    font-family: ${avantGardeGothicPRO};
	    font-weight: 500;
	    max-width: 284px;
      width: 100%;
      @media (max-width: ${LG_SCREEN - 1}px) {
	      font-size: 14px;
	    }
	  }

    @media (max-width: ${LG_SCREEN - 1}px) {
	    margin-top: 10.86px;
		  button {
	      font-size: 14px;
	    }
    }
	`
      : ''}



	strong {
    font-weight: 600;
  }
`;

export { StyledFeed, StyledFeedElement };
