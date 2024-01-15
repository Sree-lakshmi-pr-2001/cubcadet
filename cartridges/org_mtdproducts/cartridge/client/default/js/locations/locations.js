'use strict';

/**
 * Uses google maps api to render a map
 */
function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), { // eslint-disable-line
        zoom: 2,
        center: { lat: 0, lng: 0 },
        mapId: $('#map').data('map-id')
    });
    // Defines the icons for the marker
    var warehouse = $('#map').data('url-light-green');
    var office = $('#map').data('url-dark-green');
    var split = $('#map').data('url-split');
    var warehouseIcon = {
        url: warehouse,
        scaledSize: new google.maps.Size(40, 40) // eslint-disable-line
    };
    var officeIcon = {
        url: office,
        scaledSize: new google.maps.Size(40, 40) // eslint-disable-line
    };
    var splitIcon = {
        url: split,
        scaledSize: new google.maps.Size(40, 40) // eslint-disable-line
    };

    // Sets the locations on the map and defines which icon to use
    var locations = [
    { lat: -37.813629, lng: 144.963058, content: 'Melbourne, Australia (Office / Warehouse)', icon: splitIcon }, // split
    { lat: -27.469770, lng: 153.025131, content: 'Brisbane, Australia (Office / Warehouse)', icon: splitIcon }, // split
    { lat: 43.451637, lng: -80.492531, content: 'Kitchener, Canada (Office)', icon: officeIcon },
    { lat: 31.230391, lng: 121.473701, content: 'Shanghai, China (Office)', icon: officeIcon },
    { lat: 31.298973, lng: 120.585289, content: 'Suzhou, China (Office)', icon: officeIcon },
    { lat: 49.3561, lng: 16.0131, content: 'Velké Meziříčí, Czech Republic (Office)', icon: officeIcon },
    { lat: 49.3803, lng: 1.1082, content: 'Saint-Étienne-du-Rouvray, France (Office)', icon: officeIcon },
    { lat: 49.2402, lng: 6.9969, content: 'Saarbrücken, Germany (Office)', icon: officeIcon },
    { lat: 47.0559, lng: 17.8743, content: 'Nemesvámos, Hungary (Office / Warehouse)', icon: splitIcon }, // split
    { lat: 18.5204, lng: 73.8567, content: 'Pune, India (Office / Warehouse)', icon: splitIcon }, // split
    { lat: 32.3050, lng: 34.9117, content: 'Pardesiya, Israel (Office / Warehouse)', icon: splitIcon }, // split
    { lat: 45.8187, lng: 9.2961, content: 'Cesana Brianza, Italy (Office)', icon: officeIcon },
    { lat: 51.7171, lng: 5.3608, content: 'Rosmalen, Benelux (Office)', icon: officeIcon },
    { lat: 54.6017, lng: 18.1555, content: 'Gościcino, Poland (Office)', icon: officeIcon },
    { lat: 58.1750, lng: 13.5532, content: 'Falköping, Sweden (Office)', icon: officeIcon },
    { lat: 47.3475, lng: 8.2446, content: 'Villmergen, Switzerland (Office)', icon: officeIcon },
    { lat: 41.2377, lng: -81.9313, content: 'Valley City, OH (Office)', icon: officeIcon },
    { lat: 33.3062, lng: -111.8413, content: 'Chandler, AZ (Office)', icon: officeIcon },
    { lat: 39.7684, lng: -86.1581, content: 'Indianapolis, IN (Office)', icon: officeIcon },
    { lat: 36.1627, lng: -86.7816, content: 'Nashville, TN (Office)', icon: officeIcon },
    { lat: 33.7490, lng: -84.3880, content: 'Atlanta, GA (Office)', icon: officeIcon },
    { lat: 35.2271, lng: -80.8431, content: 'Charlotte, NC (Office)', icon: officeIcon },
    { lat: 49.0835, lng: 6.6978, content: 'Valmont, France (Warehouse)', icon: warehouseIcon },
    { lat: 49.4678, lng: 7.1691, content: 'Sankt Wendel, Germany (Warehouse)', icon: warehouseIcon },
    { lat: 50.7785, lng: 7.6871, content: 'Etzbach, Germany (Warehouse)', icon: warehouseIcon },
    { lat: 48.3392, lng: 7.8781, content: 'Lahr, Germany (Warehouse)', icon: warehouseIcon },
    { lat: 31.3012, lng: -110.9381, content: 'Nogales, Mexico (Manufacturing)', icon: warehouseIcon },
    { lat: 34.2576, lng: -88.7034, content: 'Tupelo, MS (Manufacturing)', icon: warehouseIcon },
    { lat: 36.3434, lng: -88.8503, content: 'Martin, TN (Manufacturing)', icon: warehouseIcon },
    { lat: 41.0531, lng: -82.7263, content: 'Willard, OH (Manufacturing)', icon: warehouseIcon },
    { lat: 40.8814, lng: -82.6618, content: 'Shelby, OH (Distribution)', icon: warehouseIcon },
    { lat: 39.9612, lng: -82.9988, content: 'Columbus, OH (Distribution)', icon: warehouseIcon },
    { lat: 32.2226, lng: -110.9747, content: 'Tuscon, AZ (Distribution)', icon: warehouseIcon }
    ];

    // Add some markers to the map.
    // Note: The code uses the JavaScript Array.prototype.map() method to
    // create an array of markers based on a given "locations" array.
    // The map() method here has nothing to do with the Google Maps API.
    var markers = locations.map(function (location) {
        return new google.maps.Marker({ // eslint-disable-line
            position: location,
            content: location.content,
            icon: location.icon
        });
    });

    var clusterStyles = [
        {
            textColor: 'white',
            url: $('#map').data('url-m1'),
            height: 50,
            width: 50,
            anchorText: [21, 2]
        }
    ];
    var options = {
        // imagePath: '../assets/images/locations/icons/m',
        styles: clusterStyles,
        maxZoom: 5 // what farthest level you can zoom in before regular markers are always displayed (1 disable / 5 default)
    };

    /* ignore jslint start */
    new MarkerClusterer(map, markers, options); // eslint-disable-line

    markers.forEach(function (marker) { // eslint-disable-line
        marker.addListener('click', function () {
            var infowindow = new google.maps.InfoWindow({ // eslint-disable-line
                content: marker.content
            }); // eslint-disable-line
            infowindow.open(map, marker);
        });
    });
    /* ignore jslint end */
}

module.exports = {
    init: function () {
        initMap();
    }
};
