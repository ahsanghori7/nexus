import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Relay from 'v1/global/services/Relay';
import Modal from '../../../global/components/modal';
import GreenButton from '../../../global/components/general-ui/Buttons';
import ClinkForm from '../../../global/components/clink-form';
import Service from '../../services/tender-template';
import { TA_LABEL } from '../../../global/helpers/constants';

const createTenderRelay = new Relay('tender_template', 'create');

const OpenModal = ({ handleClick }) => (
  <GreenButton label="Add new template" onClick={handleClick} />
);

const CloseModal = ({ handleClick }) => (
  <Button className="btn-red-inverted" onClick={handleClick}>
    Go Back
  </Button>
);

const SubmitModal = ({ handleClick, disabled }) => (
  <Button
    className="btn-green"
    type="submit"
    onClick={handleClick}
    disabled={Boolean(disabled)}
    loading={Boolean(disabled)}
  >
    Continue
  </Button>
);

const ShowButton = (props) => <OpenModal {...props} />;

const getAssetsOptions = (assets) => {
  return assets && Array.isArray(assets)
    ? assets
        .map((a) => {
          const name = a && a.name;
          const label = a && a.label;
          const id = a && a.id;
          return {
            id,
            label: name || label,
            value: id,
          };
        })
        .sort(
          (assetA, assetB) =>
            assetA &&
            assetA.label &&
            assetA.label
              .toLowerCase()
              .localeCompare(assetB.label.toLowerCase()),
        )
    : [];
};

const getTendersOptions = (tenders) => {
  return tenders && Array.isArray(tenders)
    ? tenders
        .map((a) => {
          const name = a && a.name;
          const label = a && a.label;
          const id = a && a.id;
          return {
            id,
            label: name || label,
            value: id,
          };
        })
        .sort(
          (tenderA, tenderB) =>
            tenderA &&
            tenderA.label &&
            tenderA.label
              .toLowerCase()
              .localeCompare(tenderB.label.toLowerCase()),
        )
    : [];
};

const TemplateModal = ({
  pid,
  assets,
  tenders,
  createTemplate,
  modalOpen,
  selectedTid,
  tenderAddendum,
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const serviceObject = new Service();
  useEffect(() => {
    if (tenderAddendum && !loading) {
      const taDoc = assets.filter((a) => {
        return a && a.name.toUpperCase() === TA_LABEL.toUpperCase();
      });
      if (taDoc.length > 0) {
        setLoading(true);
        const [did] = getAssetsOptions([taDoc[0]]);
        createTenderRelay
          .post({}, { tid: selectedTid, did: did?.id, pid })
          .then((response) => response.json())
          .then((e) => {
            if (e?.success && e?.docId) {
              navigate(
                `/document-creator/template/${e?.docId}/tender/${selectedTid}`,
              );
            }
          });
      }
    }
  }, [navigate, loading, tenderAddendum, assets, pid, selectedTid]);

  if (tenderAddendum) {
    return false; // Do not render the modal if it's an addendum
  }

  return (
    <Modal
      title="Create Tender Document"
      subtitle="Choose the Tender type and Package"
      showClose={false}
      beginningShow={modalOpen}
      ShowButton={ShowButton}
      className="add-tender-template-modal"
      render={(props) => {
        const { setShow } = props;
        const { initialValues, formFields, validationSchema } = serviceObject;

        formFields[0].options = getAssetsOptions(assets);
        formFields[1].options = getTendersOptions(tenders);

        const selected = tenders.filter((t) => {
          return Number(t.id) === Number(selectedTid);
        });
        if (selected.length > 0) {
          const [selectedTender] = getTendersOptions([selected[0]]);
          initialValues.tender = selectedTender;
        }
        if (tenderAddendum) {
          const taDoc = assets.filter((a) => {
            return a && a.name.toUpperCase() === TA_LABEL.toUpperCase();
          });
          if (taDoc) {
            const [selectedAsset] = getAssetsOptions([taDoc[0]]);
            initialValues.asset = selectedAsset;
          }
        }

        return (
          <ClinkForm
            initialValues={initialValues}
            formFields={formFields}
            validationSchema={validationSchema}
            handleSubmit={(data) => {
              const { tender, asset } = data;
              createTemplate(pid, tender.value, asset.value);
            }}
            submitText="Continue"
            SubmitButton={SubmitModal}
            // eslint-disable-next-line react/no-unstable-nested-components
            AuxButton={(propsBtn) => (
              <CloseModal {...propsBtn} handleClick={() => setShow(false)} />
            )}
          />
        );
      }}
    />
  );
};

export default TemplateModal;
