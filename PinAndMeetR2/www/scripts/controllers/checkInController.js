angular
    .module('app')
    .controller('checkInController', checkInController);

function checkInController($scope, $http, $state, $q, $timeout, generalServices, userServices, checkInServices, stateServices, $ionicHistory, constants) {
    $scope.checkIn = checkIn;

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
        generalServices.addLogEvent('checkInController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            generalServices.addLogEvent('checkInController', '$ionicView.enter', 'Start');
            initializeMap();
        });
    }, false);

    // ----------------------------------------------------------------------------
    // Initialize map
    // ----------------------------------------------------------------------------
    function initializeMap() {
        generalServices.addLogEvent('checkInController', 'initializeMap', 'Start', '');

        $('#attribution').hide();
        $('#noVenuesFound').hide();

        // Get geolocation and then draw the map
        generalServices.getGeolocation()
        .then(function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            generalServices.addLogEvent('checkInController', 'initializeMap', 'Location found', lat + ' ' + lng);

            var mapOptions = {
                center: { lat: lat, lng: lng },
                zoom: 16,
                minZoom: 14,
                mapTypeControl: false,
                streetViewControl: false,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.SMALL,
                    position: google.maps.ControlPosition.RIGHT_TOP
                }
            };
            map2 = new google.maps.Map(document.getElementById('map-canvas2'), mapOptions);

            // Create "center map" control
            var centerControlDiv = document.createElement('div');
            var centerControl = new CenterControl(centerControlDiv, map2);
            centerControlDiv.index = 1;
            map2.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);
            
            // Add idle listener
            // NOTE: Idle event is called every time after lauch
            google.maps.event.addListener(map2, 'idle', function () {
                getLocationAndVenues();
            });
        });
    }

    // ----------------------------------------------------------------------------
    // Get geolocation again, then venues (must get twice to make the map first)
    // ----------------------------------------------------------------------------
    function getLocationAndVenues() {
        generalServices.addLogEvent('checkInController', 'getLocationAndVenues', 'Start', '');
        generalServices.getGeolocation()
        .then(function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            var pos = new google.maps.LatLng(lat, lng);

            if (marker) marker.setMap(null);
            marker = new google.maps.Marker({
                position: pos,
                map: map2,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 5,
                    fillColor: 'blue',
                    fillOpacity: 1,
                    strokeColor: 'blue',
                    strokeOpacity: 0.1,
                    strokeWeight: 25
                },
                title: ''
            });

            // Now get the venues
            getVenues(position)
            .then(function () {
                generalServices.addLogEvent('checkInController', 'getLocationAndVenues', 'Venues updated', '');
            });
        });
    }

    function getVenues(position) {
        generalServices.addLogEvent('checkInController', 'getVenues', 'Start', '');
        return $q(function (resolve, reject) {
            clearMarkers();

            var listItems = [];
            checkInServices.getVenues(position)
            .then(function (sortedVenues) {
                if (sortedVenues.length == 0) {
                    generalServices.popMessageOk("Foursquare didn't return any venues on this area. There might be a temporary service down time. Close the Check in window, wait for couple of minutes and try again.");
                    $('#attribution').hide();
                    $('#noVenuesFound').show();
                    resolve();
                    return;
                }
                $.each(sortedVenues, function (key, value) {
                    var myLatlng = new google.maps.LatLng(value.location.lat, value.location.lng);
                    var myMarker = new google.maps.Marker({
                        position: myLatlng,
                        map: map2,
                        title: '',
                        id: value.id
                    });
                    var catName = "";
                    if (value.categories.length > 0) catName = value.categories[0].name;
                    var contentString = "<b>" + value.name + "</b> " + catName;

                    google.maps.event.addListener(myMarker, 'click', function () {
                        generalServices.addLogEvent('checkInController', 'getVenues', 'Venue selected', value.id);
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

                    var imagePrefix = "";
                    if (value.categories.length > 0) imagePrefix = value.categories[0].icon.prefix;
                    var imageUrl = generalServices.getFoursquareImageUrl(imagePrefix);
                    listItems.push({
                        id: value.id,
                        venueName: value.name,
                        category: catName,
                        distance: value.location.distance,
                        city: value.location.city,
                        lat: value.location.lat,
                        lng: value.location.lng,
                        venueImageUrl: imageUrl
                    })
                    markersArray.push(myMarker);
                });
                $scope.listItems = listItems;

                $('#noVenuesFound').hide();
                $('#attribution').show();

                resolve();
            });
        });
    }

    // -------------------------------------------------------------------------------------
    // Check in venue clicked
    // -------------------------------------------------------------------------------------
    function checkIn(item) {
        generalServices.addLogEvent('checkInController', 'checkIn', 'Start', JSON.stringify(item));

        if (circleMarker != null) circleMarker.setMap(null);
        $scope.selectedListItemId = item.id;

        var distance = item.distance;
        if (distance > constants.MAX_CHECK_IN_VENUE_DISTANCE) {

            // Over 300m from current location. This should not exist
            generalServices.popMessage('This venue is over ' + MAX_CHECK_IN_VENUE_DISTANCE + ' meters from you location. You can only check in venues you are in.')
        } else if (distance > constants.MAX_CHECK_IN_VENUE_DISTANCE_WARNING) {

            // Over 100m from location
            generalServices.popMessageOkCancel(item.venueName, 'This venue is ' + distance + ' meters from you location. Check in here?')
            .then(function () {
                commitCheckIn(item);
            });
        } else {

            // Under 100m from location
            commitCheckIn(item);
        }
    }

    // -------------------------------------------------------------------------------------
    // Commeit the check in (user within distance limit)
    // -------------------------------------------------------------------------------------
    function commitCheckIn(item) {
        generalServices.addLogEvent('checkInController', 'commitCheckIn', 'Start', JSON.stringify(item));
        checkInServices.checkIn(item)
        .then(function (data) {

            window.localStorage.setItem("lastVenueLat", item.lat);
            window.localStorage.setItem("lastVenueLng", item.lng);
            generalServices.addLogEvent('checkInController', 'commintCheckIn', 'LastVenuePosSet', item.lat + ' ' + item.lng);

            // There is someone in the same venue 
            if (data.result == 'FOUND') { // Partner found
                window.checkedIn = false;
                window.nowMatching = true;
                $ionicHistory.goBack();
                $timeout(function () {
                    window.nowMatching = false;
                    stateServices.setState('MATCHING'); // Need to wait, since $ionicHistory.goBack() above will launch $ionicView.enter
                }, 1000); 
            } else {
                // There is no-one in the venue yet or someone you have already met
                window.checkedIn = true;
                $ionicHistory.goBack();
                if (data.justMetPartnerFirstName != "") {
                    if (data.justMetPartnerFirstName != "*") {
                        generalServices.popMessageOk(item.venueName, "You have checked in. " + data.justMetPartnerFirstName + " is in this same venue, but since you have just met, you are not matched again.");
                    } else {
                        generalServices.popMessageOk(item.venueName, "You have checked in. There is one or more persons in this venue that you have already met today and you are not matched again.");
                    }
                } else {
                    generalServices.popMessage("You have checked in", "<strong>" + item.venueName + "</strong><br/><br/>Now wait until someone checks in", 4500);
                }
            }
        },
        function (data) { // Error
            generalServices.addLogError('checkInController', 'checkIn', data.error);
            if (data.result == 'FOUND') {
                // Somehow clicked Check in button though should be matching
                stateServices.setState('MATCHING'); // This will get the partner data
            } else {
                userServices.userDataNotFoundHandler();
            }
        });
    }

    function clearMarkers() {
        generalServices.addLogEvent('checkInController', 'clearMarkers', 'Start', '');
        if (markersArray) {
            for (i in markersArray) {
                markersArray[i];
            }
        }
    }

    // Create "center map" control
    function CenterControl(controlDiv, mapc) {
        generalServices.addLogEvent('checkInController', 'CenterControl', 'Start', '');

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
                //getLocationAndVenues(); Idle event will call
            });
        });
    }
}