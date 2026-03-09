function elementCreator({
    name,
    atr = [],
    pugFunc,
    func = [],
    ref,
    selector,
    privateState = {}
}) {

    class test extends HTMLElement {
        static observedAttributes = [...atr, 'param'];

        value = {
            param: undefined
        };

        privateValue = {
            isLoading: false,
            ...privateState,
        };

        loadedEvent = new Event('loaded');

        _created = false;

        constructor() {
            super();
        }

        setState = (watchValue, newValue) => {
            // sets privateValue and causes a rerender, doesn't support nested routes

            let oldValue = this.privateValue[watchValue];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                this.privateValue[watchValue] = newValue;
                this.render();
            }
        };

        populateValue = (() => {
            atr.forEach((name) => {
                this.value[name] = '';
            });
        })();

        selector = selector && selector.length > 0 ? [...selector] : [];

        attributeChangedCallback(name, oldValue, newValue) {
            this.value[name] = newValue;
        }

        reference = ref || [[]];

        render() {
            let pugHtml = pugFunc({
                prop: this.value,
                state: typeof view !== 'undefined' ? view() : null,
                url: document.location.hash,
                privateState: this.privateValue
            });
            this.innerHTML = pugHtml;
        }

        connectedCallback() {
            this.dispatchEvent(this.loadedEvent);
            if (!this._created) {
                func.forEach(({ event, callback }) => {
                    this.addEventListener(event, callback, false);
                });
                this._created = true;
            }
            this.render();
        }
    }

    if (customElements.get(name)) {
        return `<${name}></${name}>`;
    } else {
        customElements.define(name, test);
        if (typeof subscriber === 'function') subscriber(name);
        return `<${name}></${name}>`;
    }
}

// Make the element creator available globally
window.elementCreator = elementCreator;
