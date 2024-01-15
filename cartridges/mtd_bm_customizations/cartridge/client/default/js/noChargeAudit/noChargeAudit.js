'use strict';
// eslint-disable-next-line require-jsdoc
function convertToDashed(phoneNumber) {
    var newPhoneNumber = phoneNumber.replace(/\D/g, '');
    newPhoneNumber = newPhoneNumber.slice(0, 3) + '-' + newPhoneNumber.slice(3, 6) + '-' + newPhoneNumber.slice(6, 15);

    return newPhoneNumber;
}

// eslint-disable-next-line require-jsdoc
function convertDate(date) {
    var newDate = new Date(date);
    var convertedDate = newDate.toLocaleDateString();

    return convertedDate;
}

$(function () {
    console.log('window -> on load');
    $(document).ready(function () {
        console.log('potatoa');
        // eslint-disable-next-line new-cap
        $('#pagination').DataTable({
            columnDefs: [
                {
                    // eslint-disable-next-line no-unused-vars
                    render: function (data, type, row) {
                        return convertToDashed(data);
                    },
                    targets: [5]
                },
                {
                    // eslint-disable-next-line no-unused-vars
                    render: function (data, type, row) {
                        return convertDate(data);
                    },
                    targets: [3]
                }
            ]
        });
    });
});


module.exports = {
    methods: {
        // no methods yet
    }
};
