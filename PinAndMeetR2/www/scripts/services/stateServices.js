angular
    .module('app')
    .service('stateServices', stateServices);

// ------------------------------------------------------------------------------
// State change related services
// ------------------------------------------------------------------------------

function stateServices($http, $q, $timeout, $state, userServices, generalServices, matchingServices, constants, $ionicHistory) {
    this.setState = setState;
    this.getState = getState;
    this.getStateAndProcess = getStateAndProcess;

    function setState(state) {
        generalServices.addLogEvent('stateServices', 'setState', 'Start', state);
        var oldState = window.state;
        window.state = state;
        window.nowOnEvents = false;

        navigator.splashscreen.hide();
        $("body").trigger("stopPositionRefreshInterval", []);
        $("body").trigger("stopPoiRefreshInterval", []);
        //$("body").trigger("stopMatchingVenueDistanceCheckInterval", []);
        //$("body").trigger("stopReviewVenueDistanceCheckInterval", []);

        //alert(oldState + ' -> ' +state);

        //if (oldState == 'MENU.CHECK_IN') {
        //    $ionicHistory.goBack(); // Back
        //}

        switch (state) {
            case '': // MAP
                $ionicHistory.clearHistory();
                $ionicHistory.clearCache();
                $state.go("menu.map");
                break;

            case 'LAUNCH':
                $ionicHistory.clearHistory();
                $ionicHistory.clearCache();
                $state.go("launch");
                break;

            case 'SIGN_UP': $state.go("signUp"); break;
            case 'ACCOUNT_CREATED': $state.go("accountCreated"); break;
            case 'EMAIL_NOT_VERIFIED': $state.go("accountCreated"); break;
            case 'SIGN_IN': $state.go("signIn"); break;
            case 'IMAGE_UPLOAD': $state.go("imageUpload"); break;
            case 'MENU.IMAGE_UPLOAD': $state.go("menu.imageUpload"); break;
            case 'MENU.CHECK_IN': $state.go("menu.checkIn"); break;
            case 'MENU.MODIFY_ACCOUNT': $state.go("menu.modifyAccount"); break;
            case 'MENU.MY_PROFILE': $state.go("menu.myProfile"); break;
            case 'CONFIRM_IMAGE': $state.go("confirmImage"); break;

            case 'CHECKED_IN': // Not a real state, got only as return value from getStateAndProcess() and there from the backend
                //alert('xx');
                window.checkedIn = true;
                window.state = '';

                $state.go("menu.map");
                break;

            case 'MATCHING':
                matchingServices.getPartnerData() // Get patner who is defined in users data in DB and place is in window.partner
                .then(function () {
                    $state.go("matching");
                }), function () {
                    // Failed to get partner data. Reset this user and back on map
                    userServices.resetUser().then(function () { setState(''); });
                };
                break;

            case 'REVIEW':
                matchingServices.getPartnerData() // Get patner who is defined in users data in DB and place is in window.partner
                .then(function () {
                    $state.go("review");
                }), function () {
                    // Failed to get partner data. Reset this user and back on map
                    userServices.resetUser().then(function () { setState(''); });
                };
                break;

            default:
        }
    }

    // ----------------------------------------------------------------------------------
    // Get state from server DB and process
    // Called when resume or push message received
    // ----------------------------------------------------------------------------------
    function getStateAndProcess() {
        generalServices.addLogEvent('stateServices', 'getStateAndProcess', 'Start');
        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };

            generalServices.callRestApi('/getState', params)
            .then(function (data) { // Data 
                if (data.error != "") {
                    userServices.userDataNotFoundHandler();
                    reject();
                } else {
                    // Always set loggingLevel in case it has changed
                    if (data.loggingLevel != null) {
                        window.localStorage.setItem("loggingLevel", data.loggingLevel);
                        //alert(data.loggingLevel);
                    }

                    if (window.state != data.state) {
                        setState(data.state);
                        resolve();
                    } else {
                        resolve();
                    }
                }
            },
            function () { reject(); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Get state from server DB 
    // Called when resume 
    // ----------------------------------------------------------------------------------
    function getState() {
        generalServices.addLogEvent('stateServices', 'getState', 'Start');
        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };

            generalServices.callRestApi('/getState', params)
            .then(function (data) { // Data 
                if (data.error != "") {
                    userServices.userDataNotFoundHandler();
                    reject();
                } else {
                    resolve(data.state);
                }
            },
            function () { reject(); });
        });
    }

}