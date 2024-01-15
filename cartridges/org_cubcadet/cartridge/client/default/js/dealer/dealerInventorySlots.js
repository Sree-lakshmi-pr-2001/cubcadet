'use strict';

/**
 * ajax call to load dealer tile
 */
function loadTile() {
    $('.product-tile-caro .loader').each(function () {
        var $this = $(this);
        var dealerInventoryUrl = $this.data('dealer-inventory-url');
        $.ajax({
            url: dealerInventoryUrl,
            type: 'get',
            dataType: 'json',
            global: false,
            success: function (data) {
                if (data && data.success) {
                    $this.fadeOut('slow');
                    $this.replaceWith(data.dealerInventoryHTML);
                }
            }
        }).always(function () {
        });
    });
}

/**
 * recursive fucntion to load slot tiles
 */
function checkContainer() {
    if ($('.product-tile-caro').is(':visible')) {
        loadTile();
    } else {
        setTimeout(checkContainer, 50);
    }
}

module.exports = {
    dealerInventorySlotTile: function () {
        $(function () {
            checkContainer();
        });
    }
};
