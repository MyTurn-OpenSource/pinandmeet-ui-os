// https://developers.google.com/maps/documentation/javascript/reference
// https://developers.google.com/maps/documentation/javascript/examples/

// https://api.foursquare.com/v2/venues/search?client_id=NCZFSVMGX5SVNZPETEGLJQH4WUT0CU3T2ILB3HKIOXEGVGKS&client_secret=4ZUCHEHJEA43HNE2OOR3BPWKPZH2ZEENCYT0KZDE55XKYBHN&v=20130117&locale=en&radius=200&ll=60.6397,24.8847&intent=browse 
// https://developer.foursquare.com/docs/venues/search  

angular
    .module('app')
    .controller('mapController', mapController);

function mapController($scope, $http, $state, $q, $timeout, $ionicTabsDelegate, generalServices, userServices, checkInServices, stateServices, constants) {

    $scope.changeCheckInOutStatus = changeCheckInOutStatus;
    $scope.checkIn = checkIn;
    $scope.checkOut = checkOut;
    $scope.whatNext = whatNext;
    $scope.mapList = mapList;
    $scope.checkInOutTitle = "Check in";
    $scope.checkInOutIcon = "ion-ios-location";

    $scope.isCheckedin = false;

    var map;
    var markersArray = [];
    var marker;
    var accuracy = 0; // 
    var lastInfoWindow;
    var lastWatchPosition;
    var lastIdleCenterPosition;
    var watchID = null;
    var poiRefreshInterval = null;
    var positionRefreshInterval = null;

    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('mapController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        generalServices.addLogEvent('mapController', 'LOADER', 'Continue');

        initializeMap();
        setCheckInOutButton();

        // ----------------------------------------------------------------------------
        // Add event listener
        // ----------------------------------------------------------------------------
        $("body").on("stopPoiRefreshInterval", function (event) {
            stopPoiRefreshInterval();
        });


        // ----------------------------------------------------------------------------
        // Add event listener
        // ----------------------------------------------------------------------------
        $("body").on("stopPositionRefreshInterval", function (event) {
            stopPositionRefreshInterval();
        });

        // ----------------------------------------------------------------------------
        // Add event listener
        // ----------------------------------------------------------------------------
        //$("body").on("stateChangedEvent", function (event) {
        //    setCheckInOutButton();
        //});

        // ----------------------------------------------------------------------------------
        // Resume event handler
        // ----------------------------------------------------------------------------------
        $("body").on("resumeEvent", function (event) {
            refreshPois();
        });

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            if (window.nowMatching) return;
            window.nowOnEvents = false;
            
            if (window.localStorage.ripple != "YES") StatusBar.hide(); // Not available on Ripple

            if (window.state == "CHECKED_IN") alert('Should not be here');

            window.state = ''; // If open My Account for exaple and then back, state stays MENU.MY_ACCOUNT
            generalServices.addLogEvent('mapController', '$ionicView.enter', 'Start');
            window.changeProfileImage = false;
            setCheckInOutButton();
            google.maps.event.trigger(map, 'resize'); // Refresh to avoid Android "Part of map greyed" bug

            startPositionRefreshInterval();
            positionRefresh();      // This will startPositionRefreshInterval(); at the end
            checkForNewPoisBit();   // This will startPoiRefreshInterval(); at the end
        });
    }, false);

    // ----------------------------------------------------------------------------
    // Initialize map
    // ----------------------------------------------------------------------------
    function initializeMap() {
        return $q(function (resolve, reject) {

            generalServices.addLogEvent('mapController', 'initializeMap', 'Start');


            // Get geolocation and then draw the map
            // Note that geolocation is taken again in getLocation(). That is OK
            generalServices.getGeolocation()
            .then(function (position) {
                lastWatchPosition = position;
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                generalServices.addMapLogEvent('mapController', 'initializeMap', 'Location detected', lat + ' ' + lng);
                if (lat == 0 && lng == 0) geoLocationZero();

                // Make map
                var mapOptions = {
                    center: { lat: lat, lng: lng },
                    zoom: 15,
                    minZoom: 13,
                    mapTypeControl: false,
                    streetViewControl: false,
                    zoomControlOptions: {
                        style: google.maps.ZoomControlStyle.SMALL,
                        position: google.maps.ControlPosition.RIGHT_TOP
                    }
                };
                map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

                // Create "center map" control
                var centerControlDiv = document.createElement('div');
                var centerControl = new CenterControl(centerControlDiv, map);
                centerControlDiv.index = 1;
                map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);

                // Add idle listener
                // NOTE: Idle event is called every time after lauch
                google.maps.event.addListener(map, 'idle', function () {

                    // Just to make sure
                    startPositionRefreshInterval();
                    startPoiRefreshInterval();

                    generalServices.addMapLogEvent('mapController', 'initializeMap', 'idle');
                    getLocation().then(function (position) {
                        var distance = constants.IDLE_POSITION_DISTANCE * 2;
                        if (lastIdleCenterPosition) {
                            distance = generalServices.calculateDistance2(map.getCenter().lat(), map.getCenter().lng(), lastIdleCenterPosition.lat(), lastIdleCenterPosition.lng()); 
                        }
                        if (distance > constants.IDLE_POSITION_DISTANCE) {
                            refreshPois();
                        }
                    });
                });

                // Map click close open venue info window
                google.maps.event.addListener(map, 'click', function () {
                    if (lastInfoWindow) lastInfoWindow.close();
                    lastInfoWindow = null;
                });

                resolve();
            },
            function () {
                // Geolocation error
            });
        });
    }

    // Create "center map" control
    function CenterControl(controlDiv, mapc) {
        generalServices.addMapLogEvent('mapController', 'CenterControl', 'Start');

        // Set CSS for the control border.
        var controlUI = document.createElement('div');
        controlUI.style.marginBottom = '22px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Click to recenter the map';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior.
        var controlText = document.createElement('div');
        controlText.style.paddingRight = '5px';
        controlText.style.paddingBottom = '10px';
        controlText.innerHTML = '<img src="images/center-circle1.png" style="width:40px" />';
        controlUI.appendChild(controlText);

        controlUI.addEventListener('click', function () {
            getLocation()
            .then(function () {
                mapc.panTo(marker.position);
                // Checkins are refreshed automatically by Idle event
            });
        });
    }

    // ----------------------------------------------------------------------------
    // Get location and put blue circle marker on the map. Return accuracy in meters
    // ----------------------------------------------------------------------------
    function getLocation() {
        generalServices.addMapLogEvent('mapController', 'getLocation', 'Start');

        return $q(function (resolve, reject) {
            generalServices.getGeolocation()
            .then(function (position) {
                lastWatchPosition = position;
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                if (lat == 0 && lng == 0) geoLocationZero();
                //var acc = position.coords.accuracy;
                setCenterMarker(lat, lng);
                resolve(position);
            });
        });
    }

    function setCenterMarker(lat, lng) {
        generalServices.addMapLogEvent('mapController', 'setCenterMarker', 'Start', lat + ' ' + lng);
        var pos = new google.maps.LatLng(lat, lng);

        if (marker) {
            marker.setPosition(pos);
        } else {
            marker = new google.maps.Marker({
                position: pos,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 5,
                    fillColor: 'blue',
                    fillOpacity: 1,
                    strokeColor: 'blue',
                    strokeOpacity: 0.05,
                    strokeWeight: 25
                },
                title: ''
            });
        }
    }

    // ----------------------------------------------------------------------------
    // Pois = Point of Interest = Other users checked in
    // Load checkins nearby and put on the map. Position = map center, not where user is
    // ----------------------------------------------------------------------------
    function getPois(ne, sw) {
        generalServices.addMapLogEvent('mapController', 'getPois', 'Start', ne.lat() + ' ' + ne.lng() + ' ' + sw.lat() + ' ' + sw.lng());
        return $q(function (resolve, reject) {
            //var position = { lat: map.getCenter().lat(), lng: map.getCenter().lng() };

            checkInServices.getPois(ne, sw)
            .then(function (data) {
                if (data.length == 1) {
                    if (data[0].venueId == "ERROR1") {
                        // User data not found
                        userServices.userDataNotFoundHandler();
                        reject();
                        return;
                    }
                }
                clearPoiMarkers(); // Remove old ones
                $.each(data, function (key, value) {
                    var myLatlng = new google.maps.LatLng(value.lat, value.lng);
                    var markerIcon = 'images/logo-small-blue3.png';
                    var venueState = "Someone is available to meet";
                    if (value.state == 'MATCHING' || value.state == 'REVIEW') {
                        venueState = "Matched - Not available"
                        markerIcon = 'images/logo-small-red3.png';
                    }
                    if (value.state == 'FB_EVENT') {
                        venueState = ""
                        markerIcon = 'images/fb-event2.png';
                    }
                    if (value.state == 'RECOMMENDED_VENUE') {
                        venueState = "This is a recommended venue to check in and meet new people"
                        markerIcon = 'images/star3.png';
                    }

                    var myMarker = new google.maps.Marker({
                        position: myLatlng,
                        map: map,
                        icon: markerIcon,
                        title: ''
                    });

                    if (value.myVenue == true) venueState = "You";

                    var base = "";
                    if (value.state == 'FB_EVENT') {
                        // FB event
                        base =
                            "<div style='float:left;'>" +
                                "<a data-tap-disabled='true' style='' onclick='window.open(\"{url}\", \"_system\");'>" +
                                    "<img src='http://pinandmeet.com/images/facebook_bg_32.png' />" +
                                "</a>" +
                            "</div>" +
                            "<div style='margin-left:45px'>" +
                                "<a data-tap-disabled='true' style='' onclick='window.open(\"{url}\", \"_system\");'>" +
                                    "<b>{venueName}</b><br/>" +
                                    "{venueAddress}" +
                                "</a>" +
                                "<hr/>" +
                                "<a data-tap-disabled='true' style='' onclick='window.open(\"{eventUrl}\", \"_system\");'>" +
                                    "<b>{eventName}</b><br/>" +
                                    "<i>Starts at {eventStarttimeLocal}</i><br/>" +
                                    "{eventDescription}" +
                                "</a>" +
                            "</div>" +
                            "";
                        base = base.replace('{url}', 'https://facebook.com/' + value.venueId); // venueId = FB location ID 
                        base = base.replace('{url}', 'https://facebook.com/' + value.venueId); // Yes, replace must be done 2 times
                        base = base.replace('{venueName}', value.venueName);
                        base = base.replace('{venueAddress}', value.street);

                        base = base.replace('{eventUrl}', 'https://facebook.com/' + value.eventId); // Yes, replace must be done 2 times
                        base = base.replace('{eventName}', value.eventName);
                        base = base.replace('{eventStarttimeLocal}', value.eventStarttimeLocal);

                        var eventDesc = value.eventDescription;
                        if (eventDesc.length > 100) eventDesc = eventDesc.substring(0, 100) + '...';
                        base = base.replace('{eventDescription}', eventDesc);
                    } else {
                        // PNM venue

                        base =
                            "<div style='float:left;'>" +
                                "<a data-tap-disabled='true' style='' onclick='window.open(\"{url}\", \"_system\");'>" +
                                    "<img src='{imageUrl}' />" +
                                "</a>" +
                            "</div>" +
                            "<div style='margin-left:45px'>" +
                                "<a data-tap-disabled='true' style='' onclick='window.open(\"{url}\", \"_system\");'>" +
                                    "<b>{venueName}</b><br/> " +
                                    venueState +
                                "</a>" +
                            "</div>" +
                            "";
                        base = base.replace('{url}', 'https://foursquare.com/v/' + value.venueId);
                        base = base.replace('{url}', 'https://foursquare.com/v/' + value.venueId); // Yes, replace must be done 2 times
                        base = base.replace('{imageUrl}', value.venueImageUrl);
                        base = base.replace('{venueName}', value.venueName);
                    }


                    //base = base.replace('{xx}', value.myVenue);
                    //for (var i = 0; i < 30; i++) base = base.replace('<', '&lt;');

                    //generalServices.addLogEvent(base);

                    var infowindow = new google.maps.InfoWindow({
                        content: base
                    });

                    google.maps.event.addListener(myMarker, 'click', function () {
                        if (lastInfoWindow) lastInfoWindow.close();
                        lastInfoWindow = null;
                        generalServices.addMapLogEvent('mapController', 'getPois', 'Marker selected');

                        infowindow.open(map, myMarker);
                        lastInfoWindow = infowindow;
                    });
                    markersArray.push(myMarker);
                });
                //if (lastInfoWindow) lastInfoWindow.open(map, myMarker);
                resolve();
            },
            // Failed to get pois
            function () {
                reject();
            });
        });
    }


    // ----------------------------------------------------------------------------
    // Clear all Poi markers
    // ----------------------------------------------------------------------------
    function clearPoiMarkers() {
        if (lastInfoWindow) return; // Not to clear the box if visible
        generalServices.addMapLogEvent('mapController', 'clearPoiMarkers', 'Start');

        if (markersArray) {
            for (i in markersArray) {
                markersArray[i].setMap(null);
            }
        }
        markersArray = [];
    }

    // ----------------------------------------------------------------------------
    // User clicked what next button
    // ----------------------------------------------------------------------------
    function mapList() {
        window.mapNE = map.getBounds().getNorthEast();
        window.mapSW = map.getBounds().getSouthWest(); // H = LAT
        window.mapCenter = map.getCenter();
        $state.go("menu.mapList");
        $ionicTabsDelegate.select(0);
    }


    // ----------------------------------------------------------------------------
    // User clicked what next button
    // ----------------------------------------------------------------------------
    function whatNext() {
        $ionicTabsDelegate.select(0);
        $state.go("menu.whatNext");
    }

    // ----------------------------------------------------------------------------
    // User changer check-in-out status
    // ----------------------------------------------------------------------------
    function changeCheckInOutStatus() {
        $ionicTabsDelegate.select(0);
        if (window.checkedIn) checkOut(); else checkIn();
    }

    // ----------------------------------------------------------------------------
    // Set checked in out button
    // ----------------------------------------------------------------------------
    function setCheckInOutButton() {
        generalServices.addLogEvent('mapController', 'setInOutButton', 'Start');
        if (window.checkedIn) {
            $scope.checkInOutIcon = "ion-ios-location";
            $scope.checkInOutTitle = "Check out";
        } else {
            $scope.checkInOutIcon = "ion-ios-location-outline";
            $scope.checkInOutTitle = "Check in";
        }
        $scope.$apply();
    }

    // ----------------------------------------------------------------------------
    // User clicked check in button
    // ----------------------------------------------------------------------------
    function checkIn() {
        if (window.localStorage.imageUrl == '') {
            generalServices.popMessageOk('No profile picture found. Please open the Menu and select "My profile" to upload a picture.');
            return;
        }

        // Check is push notification verified
        if (window.pushNotificationVerified == false && window.localStorage.ripple != "YES") {
            initializePushNotification(); // pushHandler.js
            generalServices.popMessageOkCancel("Push notification is not active.<br/><br/>Please check push notification settings or wait about one minute and click OK to try again.")
            .then(function () {
                if (window.pushNotificationVerified == false) {
                    generalServices.spinner(true);
                    $timeout(function () {
                        generalServices.spinner(false);
                        if (window.pushNotificationVerified == true) {
                            checkIn();
                        } else {
                            generalServices.popMessageOk('Push messaging is still not responding. Wait about one minute and try again checking in.<br/><br/>If the problem persists, report the problem by www.pinandmeet.com');
                        }
                    }, 10000); // Wait 5s

                } else {
                    checkIn();
                }
            });
            return;
        }

        generalServices.addLogEvent('mapController', 'checkIn', 'Start');
        $("body").trigger("stopPositionRefreshInterval", []);
        $("body").trigger("stopPoiRefreshInterval", []);
        stateServices.setState('MENU.CHECK_IN');
    }

    // -------------------------------------------------------------------------------------
    // User clicked check out button
    // -------------------------------------------------------------------------------------
    function checkOut() {
        generalServices.addLogEvent('mapController', 'checkOut', 'Start');
        //$("body").trigger("stopMatchingVenueDistanceCheckInterval", []);
        //$("body").trigger("stopReviewVenueDistanceCheckInterval", []);

        checkInServices.checkOut()
        .then(function () {
            window.localStorage.removeItem("lastVenueLat");
            window.localStorage.removeItem("lastVenueLng");

            window.state = '';
            window.checkedIn = false;
            refreshPois();
            generalServices.popMessage("You have checked out");

            setCheckInOutButton();
        });
    }

    // ----------------------------------------------------------------------------
    // Start POI refresh interval
    // ----------------------------------------------------------------------------
    function startPoiRefreshInterval() {
        //return;
        if (poiRefreshInterval != null) return;
        generalServices.addMapLogEvent('mapController', 'startPoiRefreshInterval', 'Start', constants.POI_REFRESH_INTERVAL);
        poiRefreshInterval = setInterval(checkForNewPoisBit, constants.POI_REFRESH_INTERVAL);
    }

    // ----------------------------------------------------------------------------
    // Check are there new pois (bit up)
    // ----------------------------------------------------------------------------
    function checkForNewPoisBit() {
        if (window.paused) return;
        generalServices.addMapLogEvent('mapController', 'checkForNewPoisBit', 'Start');
        stopPoiRefreshInterval();
        refreshPois(); // This will startPoiRefreshInterval at the end 

        checkHasConnectionTypeChanged();
    }

    // ----------------------------------------------------------------------------
    // POI refresh interval actions
    // ----------------------------------------------------------------------------
    function refreshPois() {
        if (window.state != '') return;

        generalServices.addMapLogEvent('mapController', 'refreshPois', 'Start');
        stopPoiRefreshInterval();
        var ne = map.getBounds().getNorthEast();
        var sw = map.getBounds().getSouthWest(); // H = LAT
        generalServices.addMapLogEvent('mapController', 'refreshPois', 'Bounds', ne.lat() + ' ' + ne.lng() + ' ' + sw.lat() + ' ' + sw.lng());

        getPois(ne, sw)
        .then(function () {
            lastIdleCenterPosition = map.getCenter();
            startPoiRefreshInterval();
        },
        function () {
            lastIdleCenterPosition = map.getCenter();
            startPoiRefreshInterval();
        });
    }

    // ----------------------------------------------------------------------------
    // Stop POI refresh interval
    // ----------------------------------------------------------------------------

    function stopPoiRefreshInterval() {
        if (poiRefreshInterval == null) return;
        generalServices.addMapLogEvent('mapController', 'stopPoiRefreshInterval', 'Start');
        clearInterval(poiRefreshInterval);
        poiRefreshInterval = null;
    }

    // ----------------------------------------------------------------------------
    // Start position refresh interval
    // ----------------------------------------------------------------------------
    function startPositionRefreshInterval() {
        if (positionRefreshInterval != null) return;
        generalServices.addMapLogEvent('mapController', 'startPositionRefreshInterval', 'Start');
        positionRefreshInterval = setInterval(positionRefresh, constants.POSITION_REFRESH_INTERVAL);
    }

    // -------------------------------------------------------------------------------
    // Check has position changed and update map if has
    // ----------------------------------------------------------------------------
    function positionRefresh() {
        //if (window.paused) return; // So that even when paused if moved 300m -> check out
        if (window.state != '') return;

        stopPositionRefreshInterval();

        generalServices.getGeolocation()
        .then(function (position) {
            var distance = generalServices.calculateDistance(position.coords, lastWatchPosition.coords);

            // Check distance from the last position check position, not from check in venue
            if (distance > constants.POSITION_REFRESH_DISTANCE) {
                generalServices.addMapLogEvent('mapController', 'initializeMap', 'New geolocation', position.coords.latitude + ' ' + position.coords.longitude + ' ' + distance);
                lastWatchPosition = position;
                setCenterMarker(position.coords.latitude, position.coords.longitude);

                // Check is still in venue (under 300m). Check out if not
                if (window.checkedIn) { 
                    generalServices.getDistanceFromVenue()
                    .then(function (distance) {
                        if (distance > constants.MAX_CHECK_IN_VENUE_DISTANCE) {
                            userServices.setVenueOutOfRange()
                            .then(function () {
                                generalServices.popMessage('Your distance from the venue is more than ' + constants.MAX_CHECK_IN_VENUE_DISTANCE + ' meters')
                                .then(function () {
                                    checkOut();
                                    startPositionRefreshInterval();
                                });
                            });
                        } else {
                            startPositionRefreshInterval();
                        }
                    });
                } else {
                    startPositionRefreshInterval();
                }
            } else {
                startPositionRefreshInterval();
            }
        });
    }

    // ----------------------------------------------------------------------------
    // Stop position refresh interval
    // ----------------------------------------------------------------------------
    function stopPositionRefreshInterval() {
        if (positionRefreshInterval == null) return;
        generalServices.addMapLogEvent('mapController', 'stopPositionRefreshInterval', 'Start');
        clearInterval(positionRefreshInterval);
        positionRefreshInterval = null;
    }

    // ----------------------------------------------------------------------------
    // Give error message if geolocation is 0 - 0
    // ----------------------------------------------------------------------------
    function geoLocationZero() {
        generalServices.popMessageOk("Geolocation can't be found.<br/><br/>Please wait for a few seconds, then press Center Map button on bottom right corner.")
    }
}