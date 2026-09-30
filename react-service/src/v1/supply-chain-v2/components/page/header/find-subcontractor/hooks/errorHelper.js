const setNameErrorMessage = (name, error) => {
  let errorMessage = '';
  switch (error) {
    case 'not_found': {
      errorMessage = 'Not recognised';
      break;
    }
    case 'in_supply_chain': {
      errorMessage = 'This subcontractor is already part of your Supply Chain.';
      break;
    }
    default: {
      errorMessage = 'Request failed';
      break;
    }
  }
  return { [name]: errorMessage };
};

const USER_TYPING_DELAY = 750;

export default setNameErrorMessage;
export { USER_TYPING_DELAY };
