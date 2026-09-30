const getTemplate = (props = {}) => {
    const {
        url,
        icon,
        height,
        width,
        iwidth,
        notifications
    } = props;
    const noNotifications = notifications === null || notifications == 0;
    const template = document.createElement('template');
    if(!icon || !url) {
        template.innerHTML = null;
        return template;
    }
    const notification = noNotifications
      ? `<div class="notification read"><p></p></div>`
      : `<div class="notification"><p>${notifications}</p></div>`;
    template.innerHTML = `
        <style>
            div.notification {
              width: 20px;
              height: 20px;
              background-color: #FF7900;
              color: white;
              border-radius: 4px;
              position: relative;
              right: -35px;
              top: -5px;
              z-index: 1;
            }
            div.notification.read {
              background-color: transparent;
            }
            div.comms-icon {
              background-color: #f3f3f8;
              width: ${width};
              height: ${height};
              text-align: center;
              border-radius: 50%;
            }
            div.comms-icon p {
              margin: 0;
              position: relative;
              display: flex;
              justify-content: center;
              align-items: center;
              width: 20px;
              height: 20px;
            }
            a {
              position: relative;
              top: -8px;
            }
            img {
              width: ${iwidth};
            }
        </style>

        <div class="comms-icon">
            ${notification}
            <a href="${url}">
                <img src="${icon}" />
            </a>
        </div>
    `;
    return template;
}

export default getTemplate;
