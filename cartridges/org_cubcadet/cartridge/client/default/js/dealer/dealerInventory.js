'use strict';

/**
 * ajax call to load dealer tile
 */
function loadTile() {
    $('.loader').each(function () {
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

module.exports = {
    dealerInventoryTile: function () {
        $(function () {
            loadTile();
        });
    },
    inventoryTileShowMore: function () {
        $(function () {
            $(document).ajaxComplete(function () {
                loadTile();
            });
        });
    }
};
