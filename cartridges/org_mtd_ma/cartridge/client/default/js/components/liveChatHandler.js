'use strict';

/**
 * Trigger Live Chat Script on click of extra links
 */

module.exports = {
    /**
     * trigger Live Chat bot; the extra links only exists if chat bot is enabled
     * this button and click event will exist so we can trigger it directly.
     */
    triggerLiveChat: function () {
        $(document).on('click', '#dealer-live-chat, #header-live-chat', function () {
            if (window.embedded_svc && $('.helpButtonEnabled')) {
                $('.helpButtonEnabled').click();
            }
        });
    }
};
