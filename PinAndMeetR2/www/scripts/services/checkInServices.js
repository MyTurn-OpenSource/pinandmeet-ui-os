angular
    .module('app')
    .service('checkInServices', checkInServices);

// ------------------------------------------------------------------------------
// Check in related services
// ------------------------------------------------------------------------------

// Foursquare categories: https://developer.foursquare.com/docs/explore#req=venues/categories
// Foursquare endpoints: https://developer.foursquare.com/docs/

function checkInServices($http, $q, $timeout, generalServices, constants) {
    this.getVenues = getVenues;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.getPois = getPois;
    //this.newPoisExist = newPoisExist;

    // Pois = Point of Interest = Other users checked in
    function getPois(ne, sw) { 
        generalServices.addMapLogEvent('checkInServices', 'getPois', 'Start', ne.lat() + ' ' + ne.lng() + ' ' + sw.lat() + ' ' + sw.lng());

        return $q(function (resolve, reject) {  
            var params = {
                swLat: sw.lat(), swLng: sw.lng(), neLat: ne.lat(), neLng: ne.lng(),
                sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel
            };
            generalServices.callRestApi('/getPois', params, true, false, true, true)
            .then(function (data) { resolve(data); }, function () { reject(); });
        });
    }

    // Pois = Point of Interest = Other users checked in
    //function newPoisExist() {
    //    generalServices.addLogEvent('checkInServices', 'newPoisExist', 'Start');

    //    return $q(function (resolve, reject) {
    //        var params = {
    //            sessionId: window.localStorage.sessionId, id: window.localStorage.id, logEvents: window.localStorage.logEvents
    //        };
    //        generalServices.callRestApi('/newPoisExist', params, false, false)
    //        .then(function (data) { resolve(data); }, function () { reject(); });
    //    });
    //}

    function getVenues(position) {
        generalServices.addLogEvent('checkInServices', 'getVenues', 'Start', position.coords.latitude + ' ' + position.coords.longitude);
        return $q(function (resolve, reject) {
            var url = 'https://api.foursquare.com/v2/venues/search?client_id=' + constants.FOURSQUARE_CLIENT_ID
                + '&client_secret=' + constants.FOURSQUARE_SECRET
                + '&locale=en&radius=150'
                + '&ll=' + position.coords.latitude + ',' + position.coords.longitude
                + '&intent=browse&v=20140806'
                + '&categoryId=4bf58dd8d48988d1e5931735,4bf58dd8d48988d1e3931735,52e81612bcbc57f1066b79ec,4bf58dd8d48988d1a1941735' // Music venue, Pool hall, Salsa club, Collage cafe
                + ',4d4b7105d754a06374d81259,4d4b7105d754a06376d81259,4bf58dd8d48988d12f941735,52e81612bcbc57f1066b7a33,4bf58dd8d48988d1f0941735' // Food, Nightlifespot, Library, Social club, Internet cafe
            ;
            generalServices.callRestApiFullUrl(url, null, false)
            .then(function (data) {
                // Sort by distance
                var sortedVenues = data.response.venues.sort(function (a, b) {
                    return a.location.distance - b.location.distance;
                });
                resolve(sortedVenues);
            }, function () { reject(); });
        });
    }

    function checkIn(venue) {
        generalServices.addLogEvent('checkInServices', 'checkIn', 'Start', JSON.stringify(venue));
        return $q(function (resolve, reject) {
            var postData = {
                sessionId: window.localStorage.sessionId,
                id: window.localStorage.id,
                venueId: venue.id,
                city: venue.city,
                venueName: venue.venueName,
                lat: venue.lat,
                lng: venue.lng,
                category: venue.category,
                venueImageUrl: venue.venueImageUrl
            }
            generalServices.callRestApi('/checkIn', postData)
            .then(function (data) {
                if (data.result == "FOUND" || data.result == "NOT_FOUND") // Partner found?
                    resolve(data);
                else
                    reject(data); // Error must there be
            }, function () { reject(); });
        });
    }

    function checkOut() {
        generalServices.addLogEvent('checkInServices', 'checkOut', 'Start');
        return $q(function (resolve, reject) {
            var postData = {
                sessionId: window.localStorage.sessionId,
                id: window.localStorage.id
            }
            generalServices.callRestApi('/checkOut', postData)
            .then(function () { resolve(); }, function () { reject(); });
        });
    }
}