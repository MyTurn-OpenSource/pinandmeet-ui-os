angular
    .module('app')
    .controller('mapListController', mapListController);

function mapListController($scope, $http, $state, $q, $timeout, generalServices, userServices, checkInServices, stateServices, $ionicHistory, constants) {
    $scope.checkIn = checkIn;
    $scope.getMapListDetails = getMapListDetails;

    var map2;
    var markersArray = [];
    var lastInfoWindow;
    var circleMarker;
    var lastVenueUrl;
    var marker;

    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('mapListController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            if (window.nowOnEventDetails) {
                // Dont change map position
                window.nowOnEventDetails = false;
            } else {
                generalServices.addLogEvent('mapListController', '$ionicView.enter', 'Start');
                window.nowOnEvents = true;
                initializeMap();
            }
        });
    }, false);

    // ----------------------------------------------------------------------------
    // Initialize map
    // ----------------------------------------------------------------------------
    function initializeMap() {
        generalServices.addLogEvent('mapListController', 'initializeMap', 'Start', '');
        $scope.selectedListItemId = '';

        $('#attribution').hide();
        $('#noVenuesFound').hide();

        // Get geolocation and then draw the map
        generalServices.getGeolocation()
        .then(function (position) {
            var lat = window.mapCenter.lat(); // Center from MAIN map, not current position
            var lng = window.mapCenter.lng();
            generalServices.addLogEvent('mapListController', 'initializeMap', 'Location found', lat + ' ' + lng);

            var mapOptions = {
                center: { lat: lat, lng: lng },
                zoom: 15,
                minZoom: 12,
                mapTypeControl: false,
                streetViewControl: false,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.SMALL,
                    position: google.maps.ControlPosition.RIGHT_TOP
                }
            };
            map2 = new google.maps.Map(document.getElementById('map-canvas2'), mapOptions);


            // Add idle listener
            // NOTE: Idle event is called every time after lauch
            google.maps.event.addListener(map2, 'idle', function () {
                getVenues();
            });
        });
    }


    function getVenues() {
        generalServices.addLogEvent('mapListController', 'getVenues', 'Start', '');
        return $q(function (resolve, reject) {
            clearMarkers();
            var listItems = [];

            var ne = map2.getBounds().getNorthEast();
            var sw = map2.getBounds().getSouthWest(); // H = LAT
            generalServices.addMapLogEvent('mapListController', 'refreshPois', 'Bounds', ne.lat() + ' ' + ne.lng() + ' ' + sw.lat() + ' ' + sw.lng());

            checkInServices.getPois(ne, sw)
            .then(function (data) {
                if (data.length == 1) {
                    if (data[0].venueId == "ERROR1") {
                        // User data not found
                        userServices.userDataNotFoundHandler();
                        return;
                    }
                }
                var listItems = [];
                found = false;
                $.each(data, function (key, value) {
                    if (value.state == 'FB_EVENT' || value.state == 'RECOMMENDED_VENUE') {
                        found = true;
                        var markerIcon = 'images/fb-event2.png';
                        if (value.state == 'RECOMMENDED_VENUE') {
                            markerIcon = 'images/star3.png';
                            value.eventName = "Recommended venue";
                            value.eventDescription = "This is a recommended venue to check in and meet new people.";
                        }

                        // Map related
                        var myLatlng = new google.maps.LatLng(value.lat, value.lng);
                        var myMarker = new google.maps.Marker({
                            position: myLatlng,
                            map: map2,
                            icon: markerIcon,
                            title: '',
                            id: value.eventId
                        });

                        google.maps.event.addListener(myMarker, 'click', function () {
                            generalServices.addLogEvent('mapListController', 'getVenues', 'Venue selected', value.id);
                            lastVenueId = value.id;
                            if (circleMarker) circleMarker.setMap(null)
                            circleMarker = new google.maps.Marker({
                                position: myMarker.position,
                                map: map2,
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 3,
                                    fillColor: 'red',
                                    fillOpacity: 1,
                                    strokeColor: 'red',
                                    strokeOpacity: 0.1,
                                    strokeWeight: 15
                                },
                                title: ''
                            });
                            $scope.selectedListItemId = myMarker.id;
                            $scope.$apply();
                        });

                        if (value.eventStarttimeLocal == null) value.eventStarttimeLocal = "";
                        if (value.street == null) value.street = "";

                        var image = "images/facebook_bg_32.png";
                        if (value.state == 'RECOMMENDED_VENUE') {
                            image = "images/star_bg_32-2.png";
                            value.eventStarttimeLocal = "--:--";
                        }

                        listItems.push({
                            venueId: value.venueId,
                            venueName: value.venueName,
                            street: value.street,
                            eventId: value.eventId,
                            eventName: value.eventName,
                            eventDescription: value.eventDescription,
                            eventStarttimeUtc: value.eventStarttimeUtc,
                            eventStarttimeLocal: value.eventStarttimeLocal,
                            image: image,
                            venueAddressLink: 'http://maps.google.com/?q=' + value.street + ',' + value.city,
                            eventAddressLink: 'http://facebook.com/' + value.eventId
                        })
                    }

                });

                var sortedVenues = listItems.sort(function (a, b) {
                    var nameA = a.eventStarttimeLocal.toLowerCase(), nameB = b.eventStarttimeLocal.toLowerCase()
                    if (nameA < nameB) //sort string ascending
                        return -1
                    if (nameA > nameB)
                        return 1
                    return 0 //default return value (no sorting)
                });


                $scope.listItems = sortedVenues;
                if (found) {
                    $('#none-found').hide();
                    $('#some-found').show();
                } else {
                    $('#some-found').hide();
                    $('#none-found').show();
                }
            },
            // Failed to get pois
            function () {
            });
        });
    }

    // -------------------------------------------------------------------------------------
    // Check in venue clicked
    // -------------------------------------------------------------------------------------
    function checkIn(item) {
        alert('Next page please');
    }

    function clearMarkers() {
        generalServices.addLogEvent('mapListController', 'clearMarkers', 'Start', '');
        if (markersArray) {
            for (i in markersArray) {
                markersArray[i];
            }
        }
    }

    // Create "center map" control
    function CenterControl(controlDiv, mapc) {
        generalServices.addLogEvent('mapListController', 'CenterControl', 'Start', '');

        // Set CSS for the control border.
        var controlUI = document.createElement('div');
        controlUI.style.marginBottom = '22px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Click to recenter the map';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior.
        var controlText = document.createElement('div');
        controlText.style.paddingRight = '7px';
        controlText.style.paddingBottom = '0px';
        controlText.style.marginBottom = '-30px';
        controlText.innerHTML = '<img src="images/center-circle1.png" style="width:40px" />';
        controlUI.appendChild(controlText);

        controlUI.addEventListener('click', function () {
            generalServices.getGeolocation()
            .then(function (position) {
                var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                marker.setPosition(pos);
                mapc.panTo(pos);
            });
        });
    }
    function getMapListDetails(item) {
        window.mapListDetails = item;
        window.nowOnEventDetails = true;
        $state.go("menu.mapListDetails");
    }
}
