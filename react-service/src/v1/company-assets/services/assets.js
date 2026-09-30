import Relay from '../../global/services/Relay';

const assetsLoader = (type) => {
  const action = 'template';
  const method = 'fetchAll';
  const relay = new Relay(action, method);
  return new Promise((resolve) => {
    relay.getJson({ type }).then((templates) => {
      resolve(
        templates.map((i) => {
          const { id, name } = i;
          return {
            id,
            label: name,
          };
        })
      );
    });
  });
};

export default assetsLoader;
