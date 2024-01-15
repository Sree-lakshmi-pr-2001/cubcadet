'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('card', {
    label: 'Card',
    attributes: {
        class: 'fa fa-address-card'
    },
    category: 'Templates',
    content: `<div class="card">
            <img class="card-img-top" src="/on/demandware.static/-/Sites/default/vfcaffc362d18dc23d7169f3bd4a56114601eea76/350x150.png?version=1,548,260,199,000" alt="Card image cap">
            <div class="card-body">
                <h5 class="card-title">Card title</h5>
                <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="#" class="btn btn-primary">Go somewhere</a>
            </div>
        </div>`
});
