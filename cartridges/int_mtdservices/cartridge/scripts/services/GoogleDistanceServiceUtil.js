/* global empty */
'use strict';

var Site = require('dw/system/Site');

/**
 * Get Test Response
 * @returns {string} test response
 */
function getTestResponse() {
    var testRespone = {
        destination_addresses: [
            '339 Hicks St, Brooklyn, NY 11201, USA',
            '339 Hicks St, Brooklyn, NY 11201, USA',
            '339 Hicks St, Brooklyn, NY 11201, USA',
            '339 Hicks St, Brooklyn, NY 11201, USA',
            '339 Hicks St, Brooklyn, NY 11201, USA',
            '339 Hicks St, Brooklyn, NY 11201, USA',
            '585 Schenectady Ave, Brooklyn, NY 11203, USA',
            '102-01 66th Rd, Queens, NY 11375, USA',
            '1000 N Village Ave, Rockville Centre, NY 11570, USA',
            '324 Beach 19th St, Far Rockaway, NY 11691, USA',
            '585 Schenectady Ave, Brooklyn, NY 11203, USA',
            '102-01 66th Rd, Queens, NY 11375, USA',
            '1000 N Village Ave, Rockville Centre, NY 11570, USA',
            '324 Beach 19th St, Far Rockaway, NY 11691, USA'
        ],
        origin_addresses: ['P.O. Box 793, Brooklyn, NY 11207, USA'],
        rows: [
            {
                elements: [
                    {
                        distance: {
                            text: '6.5 mi',
                            value: 10423
                        },
                        duration: {
                            text: '33 mins',
                            value: 1997
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '6.5 mi',
                            value: 10423
                        },
                        duration: {
                            text: '33 mins',
                            value: 1997
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '6.5 mi',
                            value: 10423
                        },
                        duration: {
                            text: '33 mins',
                            value: 1997
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '6.5 mi',
                            value: 10423
                        },
                        duration: {
                            text: '33 mins',
                            value: 1997
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '6.5 mi',
                            value: 10423
                        },
                        duration: {
                            text: '33 mins',
                            value: 1997
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '6.5 mi',
                            value: 10423
                        },
                        duration: {
                            text: '33 mins',
                            value: 1997
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '3.0 mi',
                            value: 4823
                        },
                        duration: {
                            text: '19 mins',
                            value: 1131
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '8.4 mi',
                            value: 13550
                        },
                        duration: {
                            text: '22 mins',
                            value: 1328
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '15.9 mi',
                            value: 25550
                        },
                        duration: {
                            text: '30 mins',
                            value: 1774
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '13.2 mi',
                            value: 21308
                        },
                        duration: {
                            text: '34 mins',
                            value: 2065
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '3.0 mi',
                            value: 4823
                        },
                        duration: {
                            text: '19 mins',
                            value: 1131
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '8.4 mi',
                            value: 13550
                        },
                        duration: {
                            text: '22 mins',
                            value: 1328
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '15.9 mi',
                            value: 25550
                        },
                        duration: {
                            text: '30 mins',
                            value: 1774
                        },
                        status: 'OK'
                    },
                    {
                        distance: {
                            text: '13.2 mi',
                            value: 21308
                        },
                        duration: {
                            text: '34 mins',
                            value: 2065
                        },
                        status: 'OK'
                    }
                ]
            }
        ],
        status: 'OK'
    };

    return JSON.stringify(testRespone);
}

var getMockCall = function () {
    return {
        statusCode: 200,
        statusMessage: 'OK',
        text: getTestResponse(),
        timeout: 30000
    };
};

var getFormattedOrigin = function (originCoordinate) {
    var result = '';
    if (!empty(originCoordinate)) {
        result = result + originCoordinate.latitude + ',' + originCoordinate.longitude;
    }

    return result;
};

var getFormattedDestinations = function (destinationCoordinateList) {
    var result = '';
    if (!empty(destinationCoordinateList)) {
        for (var i = 0; i < destinationCoordinateList.length; i++) {
            var destinationCoordinate = destinationCoordinateList[i];
            result = result + destinationCoordinate.latitude + ',' + destinationCoordinate.longitude;
            if (i !== (destinationCoordinateList.length - 1)) {
                result = result + '|'; // eslint-disable-line
            }
        }
    }

    return result;
};

var getKey = function () {
    var key = Site.getCurrent().getCustomPreferenceValue('googleGeocodingAPIKey');

    return key;
};

var getUnits = function () {
    var units = Site.getCurrent().getCustomPreferenceValue('googleDrivingDistanceUnits');

    return units;
};

exports.getKey = getKey;
exports.getUnits = getUnits;
exports.getMockCall = getMockCall;
exports.getFormattedOrigin = getFormattedOrigin;
exports.getFormattedDestinations = getFormattedDestinations;
