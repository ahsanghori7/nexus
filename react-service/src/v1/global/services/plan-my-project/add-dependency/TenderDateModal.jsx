import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  CONSTANTS,
} from 'clink-components';
import { getProperDates } from 'v2/helpers/date';
import LazyImage from 'v1/global/components/LazyImage';
import Relay from 'v1/global/services/Relay';
import Form from './Form';
import DependencyForm from './index';
import { mapping } from './helper';

const { iconXBlack } = CONSTANTS.s3;

const tenderRelay = new Relay('tender', 'mapPackageDependency');
const TenderDateModal = ({
  tid = 0,
  modalHeadText = 'Set dependency',
  onInputClick,
  selectedTenders,
  date = 0,
  init = () => null,
  currentDependencies = {},
}) => {
  const [localDependencies, setLocalDependencies] = useState({});
  const [dependencies, setDependencies] = useState([]);

  const [current] = selectedTenders.filter(
    (tender) => Number(tender.id) === Number(tid)
  );
  if (!current) {
    return null;
  }
  const [parentStartOnSite, parentTenderReturn] = getProperDates(
    current.start_on_site,
    current.tender_return
  );
  const filterPastDates = selectedTenders.filter((t) => {
    const [startOnSite, tenderReturn] = getProperDates(
      t.start_on_site,
      t.tender_return
    );
    if (date === 1) {
      return (
        parentStartOnSite < startOnSite && parentTenderReturn < tenderReturn
      );
    }
    return parentStartOnSite < startOnSite;
  });

  const transformElements = (elementsArray) => {
    return elementsArray.map((el, i) => {
      if (el.parentId !== tid) {
        return null;
      }
      const [secondCurrent] = filterPastDates.filter(
        (tender) => Number(tender.id) === Number(el.tender_child_id),
      );
      if (!secondCurrent) {
        return null;
      }
      return {
        ...el,
        key: i + 1,
        date: el.tender_dependency_key,
        id: Number(el.tender_child_id),
        name: secondCurrent.label,
        label: secondCurrent.label,
      };
    });
  };

  const first = {
    key: 0,
    id: current.id,
    name: current.label,
    label: current.label,
    date,
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (currentDependencies && Object.values(currentDependencies).length) {
      const newLocalDependencies =
        (currentDependencies && { ...currentDependencies }) || {};
      const elements = {};
      for (const [key, value] of Object.entries(newLocalDependencies)) {
        if (value.length) {
          value.forEach((t) => {
            if (
              Number(t.tender_child_id) !== Number(tid) &&
              Number(t.tender_dependency_child_key) === Number(date)
            ) {
              if (!elements[key]) {
                elements[key] = [{ ...t, parentId: Number(key) }];
              } else {
                elements[key].push({ ...t, parentId: Number(key) });
              }
            }
          });
        } else {
          elements[key] = value;
        }
      }
      setLocalDependencies(elements);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDependencies]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (filterPastDates) {
      let result = [first];
      if (Object.values(localDependencies).length) {
        const newElements = Object.values(localDependencies)
          .flatMap((e) => transformElements(e))
          .filter((elem) => Boolean(elem));
        result = [first, ...newElements];
      }
      setDependencies(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDependencies]);

  const loading = Boolean(
    localDependencies && Object.values(localDependencies).length
  );

  const isSetDependencies = dependencies.length < 2;
  const buttonName = isSetDependencies ? 'Set dependency' : 'Edit dependency';
  const isSet = loading && isSetDependencies;
  const isEdit = loading && !isSetDependencies;

  return (
    <div className="datepicker-custom-content">
      {isSet && (
        <div className="datepicker-custom-content--message">
          Is this date connected to others?
        </div>
      )}
      {isEdit &&
        dependencies.map((d) => {
          if (Number(d.id) === Number(tid)) {
            return null;
          }
          const [selected] = filterPastDates.filter(
            (t) => Number(t.id) === Number(d.id)
          );
          if (!selected || (d && !d.tender_dependency_child_key)) {
            return null;
          }
          return (
            <div key={d.id} className="datepicker-custom-content--message">
              Dependency{' '}
              <span className="bold">
                {selected.label} - {mapping[d.tender_dependency_key].label}
              </span>
            </div>
          );
        })}
      <div className="add-tender-date-modal">
        <Modal
          className="add-tender-date--wrapper"
          theme="add-tender-date"
          openElement={
            <Button layout="rounded" color="green">
              {buttonName}
            </Button>
          }
          render={(modalProps) => (
            <ModalContent
              className="add-tender-date--content"
              theme="add-tender-date"
            >
              <div className="add-tender-date--content-head">
                <span className="modal-head-text">{modalHeadText}</span>
                <Button
                  className="close-button"
                  handleClick={modalProps.handleClose}
                >
                  <LazyImage src={iconXBlack} alt="Close Icon" />
                </Button>
              </div>
              <div className="add-tender-date--content-body">
                {dependencies.map((dependency, index) => {
                  let filterSelectedTenders = filterPastDates;
                  if (index) {
                    filterSelectedTenders = filterPastDates.filter(
                      (d) => Number(d.id) !== Number(tid)
                    );
                  }
                  const service = new DependencyForm(
                    filterSelectedTenders,
                    dependency,
                    index,
                    date,
                    [dependencies, setDependencies]
                  );
                  const { initialValues, formFields, validationSchema } =
                    service;
                  if (!(initialValues && formFields && validationSchema)) {
                    return null;
                  }
                  return (
                    <Form
                      key={dependency.key}
                      index={index}
                      dependencies={dependencies}
                      setDependencies={setDependencies}
                      service={service}
                    />
                  );
                })}
                {localDependencies && dependencies.length < 2 && (
                  <button
                    className="another-dependency"
                    onClick={() =>
                      setDependencies([
                        ...dependencies,
                        {
                          key: dependencies.length,
                          id: null,
                          name: null,
                          label: null,
                          date,
                        },
                      ])
                    }
                  >
                    Add another dependency
                  </button>
                )}
              </div>
              <div className="add-tender-date--content-buttons">
                <Button
                  className="cancel-button"
                  layout="rounded"
                  color="green"
                  handleClick={() => {
                    modalProps.handleClose();
                    onInputClick();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="confirm-button"
                  layout="rounded"
                  color="green"
                  handleClick={() => {
                    // eslint-disable-next-line no-unused-vars
                    const [_, ...rest] = dependencies;
                    let data = rest.map((dep) => ({
                      tender_id: Number(dep.id),
                      tender_dependency_key: Number(dep.date),
                      tender_dependency_parent_key: date,
                    }));
                    if (currentDependencies[tid].length) {
                      const ids = data.map((d) => d.tender_id);
                      let prevDependencies = currentDependencies[tid].filter(
                        (d) => !ids.includes(d.tender_child_id)
                      );
                      prevDependencies = prevDependencies.filter(
                        (d) => d.tender_dependency_child_key !== date
                      );
                      data = [
                        ...data,
                        ...prevDependencies.map((d) => ({
                          tender_dependency_key: d.tender_dependency_key,
                          tender_dependency_parent_key:
                            d.tender_dependency_child_key,
                          tender_id: d.tender_child_id,
                        })),
                      ];
                    }
                    return tenderRelay.post(data, { tid }).then(() => {
                      onInputClick();
                      init();
                    });
                  }}
                >
                  Confirm
                </Button>
              </div>
            </ModalContent>
          )}
        />
      </div>
    </div>
  );
};

export default TenderDateModal;
