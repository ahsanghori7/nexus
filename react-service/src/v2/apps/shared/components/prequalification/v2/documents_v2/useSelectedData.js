import { useState } from 'react';

const useSelectedData = (data) => {
  const [selectedData, setSelectedData] = useState(null);

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };

  const resetSelect = () => {
    setSelectedValue(data);
  };

  return [selectedData, setSelectedData, handleChange, resetSelect];
};

export default useSelectedData;
