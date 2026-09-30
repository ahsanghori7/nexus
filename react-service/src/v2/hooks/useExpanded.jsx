import { useState, useEffect } from 'react';

const useExpanded = (selectedTender, multi = false) => {
  const [expanded, setExpanded] = useState([]);
  const [singleOpen, setSingleOpen] = useState(true);

  useEffect(() => {
    setSingleOpen(!multi);
  }, [multi]);

  const handleChangeExpanded = (id) => {
    if (singleOpen) {
      setExpanded(expanded.includes(id) ? [] : [id]);
    } else {
      setExpanded(
        expanded.includes(id)
          ? expanded.filter((i) => i !== id)
          : [...expanded, Number(id)]
      );
    }
  };

  useEffect(() => {
    if (selectedTender) {
      handleChangeExpanded(selectedTender.id);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTender]);

  return { expanded, handleChangeExpanded };
};

export default useExpanded;
