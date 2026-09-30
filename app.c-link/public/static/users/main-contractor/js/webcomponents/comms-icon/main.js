import getTemplate from "./template.js";
import getCookie from "./helpers.js";

// TODO: Call the endpoint for retrieving new messages
class CommsIcon extends HTMLElement {

    constructor(mode = 'open') {
        super();
        this.attachShadow = this.attachShadow({
            mode
        });
        const templateClone = getTemplate(this.attributesObject).content.cloneNode(true);
        this.shadowRoot.appendChild(templateClone);
        this.getNotifications();
    }

    static get observedAttributes() {
        return ['height', 'width', 'iwidth', 'url', 'icon', 'notifications'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const templateClone = getTemplate(this.attributesObject).content.cloneNode(true);
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(templateClone);
    }

    static get name() {
        return this.hasOwnProperty('_name') ? this._name : void 0;
    }

    static set name(v) {
        this._name = v;
    }

    get height() {
        return this.getAttribute('height');
    }

    get width() {
        return this.getAttribute('width');
    }

    get iwidth() {
        return this.getAttribute('iwidth');
    }

    get url() {
        return this.getAttribute('url');
    }

    set url(url) {
        if (url) {
            this.setAttribute('url', url);
        } else {
            this.removeAttribute('url');
        }
    }

    get icon() {
        return this.getAttribute('icon');
    }

    set icon(icon) {
        if (icon) {
            this.setAttribute('icon', icon);
        } else {
            this.removeAttribute('icon');
        }
    }

    get notifications() {
        return this.getAttribute('notifications');
    }

    set notifications(notifications) {
        if (notifications !== null) {
            this.setAttribute('notifications', notifications);
        } else {
            this.removeAttribute('notifications');
        }
    }

    get attributesObject() {
        return {
            url: this.url,
            icon: this.icon,
            height: this.height,
            width: this.width,
            iwidth: this.iwidth,
            notifications: this.notifications
        };
    }

    get api() {
        return this.getAttribute('api');
    }

    set api(api) {
        if (api) {
            this.setAttribute('api', api);
        } else {
            this.removeAttribute('api');
        }
    }

    async getNotifications() {
        const token = getCookie('token');
        const fullUrl = `${this.api}/v1/room_unviewed_count?token=${token}`;
        const params = {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const countResponse = await fetch(fullUrl, params)
          .then(response => (response.json()))
          .catch(error => ({error}));
        if (!countResponse.error) {
            this.notifications = countResponse.count;
        }
    }

}

CommsIcon.name = 'comms-icon';

customElements.define(CommsIcon.name, CommsIcon);
