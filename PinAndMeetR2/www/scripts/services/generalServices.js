angular
    .module('app')
    .service('generalServices', generalServices);

// ------------------------------------------------------------------------------
// General functions for logging etc
// ------------------------------------------------------------------------------

function generalServices($http, $ionicPopup, $timeout, $q, $ionicLoading, constants) {

    this.addLogEvent = addLogEvent;
    this.addLogError = addLogError;
    this.addMapLogEvent = addMapLogEvent;
    this.popMessage = popMessage;
    this.popMessageOk = popMessageOk;
    this.popMessageOkCancel = popMessageOkCancel;
    this.popMessageRetry = popMessageRetry;
    this.spinner = spinner;
    this.callRestApi = callRestApi;
    this.callRestApiFullUrl = callRestApiFullUrl;
    this.getFoursquareImageUrl = getFoursquareImageUrl;
    this.getGeolocation = getGeolocation;
    this.calculateDistance = calculateDistance;
    this.calculateDistance2 = calculateDistance2;
    this.calculateAge = calculateAge;
    this.getLocalTimeStamp = getLocalTimeStamp;
    this.getDistanceFromVenue = getDistanceFromVenue;
    this.flushLogBatch = flushLogBatch;
    this.spinner = spinner;
    
    // ----------------------------------------------------------------------------------
    // Add one event in event log on server
    // ----------------------------------------------------------------------------------
    function addLogEvent(module, method, eventName, parameters) {
        if (parameters === undefined) parameters = '';
        if (window.localStorage.loggingLevel == undefined || window.localStorage.loggingLevel >= 10) addLog(module, method, eventName, parameters, 'EVENT');
    }

    function addMapLogEvent(module, method, eventName, parameters) {
        if (parameters === undefined) parameters = '';
        if (window.localStorage.loggingLevel == undefined || window.localStorage.loggingLevel >= 10) addLog(module, method, eventName, parameters, 'MAP_EVENT');
    }

    function addLogError(module, method, eventName, parameters) {
        if (parameters === undefined) parameters = '';
        addLog(module, method, eventName, parameters, 'ERROR');
    }

    //public enum LoggingLevels { 
    //    NO = 0,                     // Only errors
    //    ONLY_SERVICE_EVENTS = 1,    // Errors and service events (no events from client)
    //    ALL_NO_MAP_INSTANT = 10,    // Errors and events (not map events)
    //    ALL_NO_MAP_BATCH = 20,      // Errors and events (not map events).  Send as a batch
    //    ALL_INSTANT = 110,          // Errors and events 
    //    ALL_BATCH = 120             // Errors and events                    Send as a batch
    //};


    // Change also pushHandler.js
    function addLog(module, method, eventName, parameters, type) {
        var ls = window.localStorage;
        var loggingLevel = ls.loggingLevel;
        if (type == undefined || type == null) type = 'EVENT';
        if (parameters == undefined || parameters == null) parameters = '';
        if (loggingLevel == undefined || loggingLevel == null) loggingLevel = 110;
        //alert(module + ', ' + method + ', ' + eventName + ', ' + parameters + ', ' + type + ', ' + loggingLevel);
        // Check if this event should not be logged
        if (type == 'MAP_EVENT' && loggingLevel < 110) return;
        
        var logEvent = {
            id: ls.id,
            sessionId: ls.sessionId,
            loggingLevel: loggingLevel,
            module: module,
            method: method,
            eventName: eventName,
            parameters: parameters,
            localTimeStamp: getLocalTimeStamp()
        };

        // Send log entry, don't catch if OK or not
        if (type == 'ERROR') {
            $.ajax({
                url: constants.SERVICE_URL + "/addLogError",
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(logEvent),
                timeout: constants.REST_CALL_TIMEOUT
            });
            return;
        }

        // Event
        if (loggingLevel == 20 || loggingLevel == 120) {
            // Batch
            window.logBatch.push(logEvent);
        } else {
            // Instant
            //alert(constants.SERVICE_URL);
            //alert(JSON.stringify(logEvent));
            //alert(constants.SERVICE_URL + "/addLogEvent" + " " + logEvent);
            $.ajax({
                url: constants.SERVICE_URL + "/addLogEvent",
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(logEvent),
                timeout: constants.REST_CALL_TIMEOUT
            });
            //$http.post(constants.SERVICE_URL + "/addLogEvent", logEvent);
            //alert('meni');
        }
    }

    function getTime() {
        var currentTime = new Date();
        var currentHours = currentTime.getHours();
        var currentMinutes = currentTime.getMinutes();
        var currentSeconds = currentTime.getSeconds();
        var currentMilliSeconds = currentTime.getMilliseconds();

        // Pad the minutes and seconds with leading zeros, if required
        currentHours = (currentHours < 10 ? "0" : "") + currentHours;
        currentMinutes = (currentMinutes < 10 ? "0" : "") + currentMinutes;
        currentSeconds = (currentSeconds < 10 ? "0" : "") + currentSeconds;
        currentMilliSeconds = (currentMilliSeconds + "00").substr(0, 2);
        return currentHours + ":" + currentMinutes + ":" + currentSeconds + "." + currentMilliSeconds;
    }

    function getDate() {
        var currentTime = new Date();
        var currentDay = currentTime.getDate();
        var currentMonth = currentTime.getMonth() + 1;
        var currentYear = currentTime.getFullYear();

        // Pad the minutes and seconds with leading zeros, if required
        currentDay = (currentDay < 10 ? "0" : "") + currentDay;
        currentMonth = (currentMonth < 10 ? "0" : "") + currentMonth;
        return currentYear + "-" + currentMonth + "-" + currentDay;
    }

    function flushLogBatch() {
        $.ajax({
            url: constants.SERVICE_URL + "/addLogEventBatch",
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(window.logBatch),
            timeout: constants.REST_CALL_TIMEOUT
        });

        //$http.post(constants.SERVICE_URL + "/addLogEventBatch", window.logBatch);
    }

    // ----------------------------------------------------------------------------------
    // Get timestamp in format yyyy-MM-dd hh:mm:ss.ms
    // ----------------------------------------------------------------------------------
    function getLocalTimeStamp() {
        return getDate() + ' ' + getTime();
    }

    // ----------------------------------------------------------------------------------
    // Call rest api (POST) and open Retry-Cancel page if call fails. Add service_url
    // ----------------------------------------------------------------------------------
    function callRestApi(serviceUrl, parameters, showResultInLog, showSpinner, retryOnError, isMapEvent) {
        return callRestApiFullUrl(constants.SERVICE_URL + serviceUrl, parameters, showResultInLog, showSpinner, true, isMapEvent);
    }

    // ----------------------------------------------------------------------------------
    // Call rest api (POST) and open Retry-Cancel page if call fails
    // ----------------------------------------------------------------------------------
    function callRestApiFullUrl(serviceUrl, parameters, showResultInLog, showSpinner, retryOnError, isMapEvent) {
        if (showResultInLog === undefined) showResultInLog = true;
        if (showSpinner === undefined) showSpinner = true;
        if (retryOnError === undefined) retryOnError = true;
        if (isMapEvent === undefined) isMapEvent = false;

        return $q(function (resolve, reject) {
            spinner(showSpinner);
            if (parameters == null) parameters = { value: 'none' };
            if (isMapEvent) addMapLogEvent('generalServices', 'callRestApiFullUrl', serviceUrl, JSON.stringify(parameters)); else addLogEvent('generalServices', 'callRestApiFullUrl', serviceUrl, JSON.stringify(parameters));

            $.ajax({
                url: serviceUrl,
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(parameters),
                timeout: constants.REST_CALL_TIMEOUT
            })
            .success(function (data, status, headers, config) {
                spinner(false);
                if (showResultInLog) {
                    if (isMapEvent)
                        addMapLogEvent('generalServices', 'callRestApiFullUrl', 'Return values', serviceUrl + ' ' + JSON.stringify(parameters) + ' ' + JSON.stringify(data));
                    else
                        addLogEvent('generalServices', 'callRestApiFullUrl', 'Return values', serviceUrl + ' ' + JSON.stringify(parameters) + ' ' + JSON.stringify(data));
                } else {
                    if (isMapEvent)
                        addMapLogEvent('generalServices', 'callRestApiFullUrl', 'Returned values, but not logged on purpose', serviceUrl + ' ' + JSON.stringify(parameters));
                    else
                        addLogEvent('generalServices', 'callRestApiFullUrl', 'Returned values, but not logged on purpose', serviceUrl + ' ' + JSON.stringify(parameters));
                }
                resolve(data);
            })
            .error(function (data, status, headers, config) {
                spinner(false);
                navigator.splashscreen.hide();
                addLogError('generalServices', 'callRestApiFullUrl', 'Rest call failed', serviceUrl + ' ' + JSON.stringify(parameters) + ' ' + JSON.stringify(data));
                if (!retryOnError) reject();
                popMessageRetry('Network connection is not available or server is not responding.')
                .then(function () {
                    callRestApiFullUrl(serviceUrl, parameters) // Clicked Yes for Retry -> Call this again
                    .then(function (data) {
                        resolve(data);
                    },
                    function (data) {
                        reject(data);
                    });
                },
                function () {
                    if (isMapEvent)
                        addMapLogEvent('generalServices', 'callRestApiFullUrl', 'User clicked Cancel');
                    else
                        addLogEvent('generalServices', 'callRestApiFullUrl', 'User clicked Cancel');
                    reject();
                });
            });
        });
    }

    // ----------------------------------------------------------------------------------
    // Simple message that will dissappear in 3 sec
    // ----------------------------------------------------------------------------------
    function popMessage(value, template, popTime) { // See https://docs.angularjs.org/api/ng/service/$q
        if (!popTime) popTime = constants.POP_MESSAGE_TIMEOUT;
        return $q(function (resolve) {
            var myPopup;
            if (template) {
                myPopup = $ionicPopup.show({
                    title: value,
                    template: '<center>' + template + '</center>'
                });
            } else {
                myPopup = $ionicPopup.show({
                    title: value,
                });
            }

            $timeout(function () {
                myPopup.close();
                resolve();
            }, popTime);
        });
    }

    // ----------------------------------------------------------------------------------
    // Simple message and OK button
    // ----------------------------------------------------------------------------------
    function popMessageOk(value, template) {
        return $q(function (resolve) {
            var alertPopup;
            if (template) {
                alertPopup = $ionicPopup.alert({
                    title: value,
                    template: '<center>' + template + '</center>'
                });
            } else {
                alertPopup = $ionicPopup.alert({
                    title: value
                });
            }


            alertPopup.then(function (res) {
                alertPopup.close();
                resolve();
            });
        });
    }


    // ----------------------------------------------------------------------------------
    // Ok/Cancel
    // ----------------------------------------------------------------------------------
    function popMessageOkCancel(value, template) {
        return $q(function (resolve, reject) {
            var alertPopup;

            if (template) {
                alertPopup = $ionicPopup.confirm({
                    title: value,
                    template: '<center>' + template + '</center>'
                });
            } else {
                alertPopup = $ionicPopup.confirm({
                    title: value
                });
            }

            alertPopup.then(function (res) {
                alertPopup.close();
                if (res)
                    resolve();
                else
                    reject();
            });
        });
    }

    // ----------------------------------------------------------------------------------
    // Retry page
    // ----------------------------------------------------------------------------------
    function popMessageRetry(value) {
        return $q(function (resolve, reject) {
            if (window.popUpAlreadyOpen) {
                reject();
                return;
            }
            window.popUpAlreadyOpen = true;

            window.retryPopup = $ionicPopup.confirm({
                title: value,
                template: '<center>Click OK to try again.</center>'
            });

            window.retryPopup.then(function (res) {
                window.retryPopup.close();
                window.popUpAlreadyOpen = false;
                if (res)
                    resolve();
                else
                    reject();
            });
        });
    }

    // ----------------------------------------------------------------------------------
    // Resume event handler
    // ----------------------------------------------------------------------------------
    $("body").on("resumeEvent", function (event) {
        if (window.retryPopup != null) {
            window.popUpAlreadyOpen = false;
            window.retryPopup.close();
            reject(); // Resume will always do state check of launch
        }
    });

    // ----------------------------------------------------------------------------------
    // Show or hide spinner
    // ----------------------------------------------------------------------------------
    function spinner(show) {
        if (show) {
            $ionicLoading.show({ template: '<ion-spinner></ion-spinner>', noBackdrop: true });
        } else {
            $ionicLoading.hide();
        }
    }

    // ----------------------------------------------------------------------------------
    // Get foursquare image url from category data
    //  From: https://ss3.4sqi.net/img/categories_v2/food/fastfood_
    //  To: https://foursquare.com/img/categories_v2/food/icecream_bg_32.png
    //  All categories: https://developer.foursquare.com/docs/explore#req=venues/categories
    // ----------------------------------------------------------------------------------
    function getFoursquareImageUrl(prefix) {
        if (prefix == "") return 'https://foursquare.com/img/categories_v2/arts_entertainment/default_bg_32.png'
        var pos = prefix.indexOf('/img');
        var len = prefix.length;
        var prime = prefix.substr(pos + 1, len - pos - 1);
        return 'https://foursquare.com/' + prime + 'bg_32.png';
    }

    // ----------------------------------------------------------------------------------
    // Get geolocation
    // ----------------------------------------------------------------------------------
    function getGeolocation(showRetry) {
        addMapLogEvent('generalServices', 'getGeolocation', 'Start');
        if (showRetry == undefined) showRetry = true;

        return $q(function (resolve, reject) {
            var geo_options = { maximumAge: 60000, timeout: 15000, enableHighAccuracy: true };
            navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, geo_options);

            // Geolocation success
            function onLocationSuccess(position) {
                addMapLogEvent('generalServices', 'getGeolocation', 'onLocationSuccess', JSON.stringify(position));
                // NYC
                //position.coords.latitude = 40.756857987657185;
                //position.coords.longitude = -73.9715801388683;
                resolve(position);
            }

            // onError Callback receives a PositionError object
            function onLocationError(error) {
                navigator.splashscreen.hide();
                if (!showRetry) {
                    reject();
                    return;
                }
                addLogError('generalServices', 'getGeolocation', 'onLocationError', JSON.stringify(error));
                popMessageOk('Geolocation error.<br/><br/>Please check is your GPS activated.<br/><br/>If GPS is on, wait for about one minute to get better location fix and click OK.')
                .then(function () {
                    getGeolocation() // Clicked Ok for Retry -> Call this again
                    .then(function (position) {
                        resolve(position);
                    });
                },
                function () {
                    addMapLogEvent('generalServices', 'getGeolocation', 'User clicked Cancel');
                    reject();
                });
            }
        });
    }


    // ----------------------------------------------------------------------------------
    // Get geolocation and calculate distance to selected venue
    // ----------------------------------------------------------------------------------
    function getDistanceFromVenue() {
        addLogEvent('generalServices', 'getDistanceFromVenue', 'Start');

        return $q(function (resolve, reject) {
            var lat = window.localStorage.lastVenueLat;
            var lng = window.localStorage.lastVenueLng;
            if (lat == null || lng == null) reject();
            addLogEvent('generalServices', 'getDistanceFromVenue', 'lat lng', lat + ' ' + lng);

            return getGeolocation()
            .then(function (position) {
                //alert(JSON.stringify(position));

                var posLat = position.coords.latitude;
                var posLng = position.coords.longitude;
                addLogEvent('generalServices', 'getDistanceFromVenue', 'posLat posLng', posLat + ' ' + posLng);
                var distance = calculateDistance2(lat, lng, posLat, posLng);
                addLogEvent('generalServices', 'getDistanceFromVenue', 'distance', distance);
                resolve(distance);
            },
            function () {
                reject();
            });
        });
    }

    //function getGeolocation() {
    //    addLogEvent('Getting geo location');

    //    return $q(function (resolve, reject) {
    //        var geo_options = {
    //            enableHighAccuracy: true,
    //            timeout: 2000
    //        };
    //        addLogEvent('Getting geo location now');

    //        navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, geo_options);

    //        // Geolocation success
    //        function onLocationSuccess(position) {
    //            addLogEvent("Geolocation: " + JSON.stringify(position));
    //            resolve(position);
    //        }

    //        // onError Callback receives a PositionError object
    //        function onLocationError(error) {
    //            addLogError("Geolocation error: " + error.code + " - " + error.message);
    //            popMessageRetry('Geolocation error. Please check is your GPS activated.')
    //            .then(function () {
    //                getGeolocation() // Clicked Yes for Retry -> Call this again
    //                .then(function (position) {
    //                    resolve(position);
    //                },
    //                function (position) {
    //                    reject(position);
    //                });
    //            },
    //            function () {
    //                addLogError("User clicked Cancel");
    //                reject();
    //            });
    //        }
    //    });
    //}

    // ----------------------------------------------------------------------------------
    // Calculate distance between two positions. position must be { latitude: lat1, longitude : lng1}
    // ----------------------------------------------------------------------------------
    function calculateDistance(position1, position2) {
        var lat1 = position1.latitude;
        var lng1 = position1.longitude;
        var lat2 = position2.latitude;
        var lng2 = position2.longitude;
        return calculateDistance2(lat1, lng1, lat2, lng2);
    }

    function calculateDistance2(lat1, lng1, lat2, lng2) {
        var coord1 = new google.maps.LatLng(lat1, lng1);
        var coord2 = new google.maps.LatLng(lat2, lng2);
        return google.maps.geometry.spherical.computeDistanceBetween(coord1, coord2);
    }


    // ----------------------------------------------------------------------------------
    // Calculate age based on birthdate
    // ----------------------------------------------------------------------------------
    function calculateAge(birthdate) {
        if (birthdate == "") return 0;
        var birthYear = birthdate.split('-')[0];
        var birthMonth = birthdate.split('-')[1];
        var birthDay = birthdate.split('-')[2];
        var currentDate = new Date();
        var currentYear = currentDate.getFullYear();
        var currentMonth = currentDate.getMonth();
        var currentDay = currentDate.getDate();
        var age = currentYear - birthYear;

        if (currentMonth < birthMonth - 1) {
            age--;
        }
        if (birthMonth - 1 == currentMonth && currentDay < birthDay) {
            age--;
        }
        return age;
    }
}