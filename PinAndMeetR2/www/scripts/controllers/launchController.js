angular
    .module('app')
    .controller('launchController', launcController);

// ----------------------------------------------------------------------------------
// Launch controller = Start-up of the application
// ----------------------------------------------------------------------------------

// select logeventid,id, stage, module, method, type, eventname, parameters, localtimestamp from LogEvents order by localtimestamp desc, logeventid desc

// TODO: Check that apns or gcm token exist JOS ohitetaan pushHandler 

//CREATE INDEX ContactIndex ON Contacts (Id, PartnerId)
//CREATE INDEX HistoryEventsIndex ON HistoryEvents (Id)
//CREATE INDEX LogEventsIndex ON LogEvents (Id)
//CREATE INDEX MessagesIndex ON [Messages] (FromId, ToId)
//CREATE INDEX ReviewsIndex ON Reviews (Id)
//CREATE INDEX UsersIndex ON Users (Id, SessionId)



function launcController($scope, $ionicModal, $rootScope, $state, $timeout, $ionicPopover, $ionicHistory, $ionicPopup, $ionicPlatform, generalServices, userServices, stateServices, constants) {

    $scope.fbSignIn = fbSignIn;
    var rippleSignFb = false;    // false = ripple pnm

    $scope.createAccount = createAccount;
    $scope.signIn = signIn;

    window.state = "LAUNCH";
    window.checkedIn = false;
    window.popUpAlreadyOpen = false;
    window.connectionType = "";
    window.logBatch = [];
    window.nowMatching = false;
    window.nowOnEvents = false;
    window.nowOnEventDetails = false;
    window.pushNotificationVerified = false;
    window.warnedAboutiIS91 = false;

    var logBatchInterval = null;

    window.paused = false;
    var pauseTime;

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    function onDeviceReady() {
        //alert('Ready as you are, sir.')
    };

    // ----------------------------------------------------------------------------------
    // Device ready event
    // ----------------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        //alert('NONYTOIMII');
        generalServices.addLogEvent('launchController', 'LOADER', 'Start');
        //alert('NONYTOIMII-----------');

        if (window.eventsLoaded != undefined) {
            generalServices.addLogEvent('launchController', 'LOADER', 'Events already loaded');
            launch();
            return;
        }
        window.eventsLoaded = true;

        generalServices.addLogEvent('launchController', 'LOADER', 'Continue');

        // Just to activate gps asap, but no retry message if not found
        generalServices.getGeolocation(false);

        // ----------------------------------------------------------------------------------
        // Is ripple. Can't do authenticate. TESTING ONLY
        // ----------------------------------------------------------------------------------
        window.localStorage.setItem("ripple", "NO");

        if (device.uuid == '3D0AD03B-8B46-431A-BEF5-FF01B96BA990') {
            window.localStorage.setItem("ripple", "YES"); // Used in userServices.signInAndValidateSession

            if (rippleSignFb) {
                var fbat = "CAAFYwOJqPosBAGNc7qbmMeSqzpTuJi8vtEvVVcuHCukTuZBko77PCziyPEPD3dpmjzrbVeZBwiuxM274FUk0GVRYHGKOl3GWuntAahpk3k1rL6brlf4QZBqZAXwTW7yobMZAZCaXUQm2qoDtMzp4BYmzqZCQPjezd2rqatBo4pl1NZAdNMmpxZAka";
                window.localStorage.removeItem("fbAccessToken");
                window.localStorage.setItem("fbAccessToken", fbat);
                window.localStorage.setItem("id", "10153374187653948"); // User id
            }
        } else {
            StatusBar.hide(); // Not available on Ripple
        }

        generalServices.addLogEvent('launchController', '', 'Ripple', window.localStorage.ripple);
    
        // Check that not iOS 9.1
        if (device.platform == 'iOS' && device.version == '9.1') {
            generalServices.popMessageOk("Your device has iOS version 9.1 which has a know error affecting menu behaviour.<br/><br/>It's highly recommeded to update your device to the latest iOS version before using this application.");
        }

        // Add timer to send log batch
        if (logBatchInterval == null) logBatchInterval = setInterval(flushLogBatch, constants.LOG_BATCH_FLUSH_INTERVAL);

        // ----------------------------------------------------------------------------------
        // Disable back-button
        // ----------------------------------------------------------------------------------
        $ionicPlatform.registerBackButtonAction(function (event) {
            if (window.state == "LAUNCH" || window.state == "MAP" || window.state == '' || window.state == "MATCHING" || window.state == "REVIEW") {
                if (window.nowOnEvents) {
                    $ionicHistory.goBack();
                } else {
                    event.preventDefault();
                }
            }
            else {
                $ionicHistory.goBack();
            }
        }, 100);

        window.shouldRotateToOrientation = function (degrees) {
            return true;
        }

        // ----------------------------------------------------------------------------------
        // Pause event
        // ----------------------------------------------------------------------------------
        document.addEventListener("pause", function () {
            pauseTime = new Date;
            window.paused = true;
            generalServices.addLogEvent('launchController', '', 'Pause');
            if (window.state.substr(0, 4) == 'MENU') $ionicHistory.goBack();
        }, false);

        // ----------------------------------------------------------------------------------
        // Resume event
        // ----------------------------------------------------------------------------------
        document.addEventListener("resume", function () {
            resumeAction();
        }, false);

        //document.addEventListener("offline", onOffline, false);

        //document.addEventListener("online", onOnline, false);

        // ----------------------------------------------------------------------------------
        // Push message received event handler
        // Raised from pushHandler.js
        // ----------------------------------------------------------------------------------
        $("body").on("pushMessageEvent", function (event, title, message, dummyId) {
            generalServices.addLogEvent('launchController', '', 'pushMessageEvent', title + ' ' + message);
            if (title == "Pin'n'Meet") {
                if (message == "Pin'n'Meet communication on") {
                    // Push communication check
                    generalServices.addLogEvent('launchController', '', 'pushMessageEvent', 'pushNotificationVerified');
                    window.pushNotificationVerified = true;
                } else {
                    // Change state event 
                    // If there is a message following the state change. Usually is
                    if (message != "") generalServices.popMessage(message);

                    // Now change the state
                    stateServices.getStateAndProcess();
                }

            } else {
                // Chat event
                // This is not catch here, but instead on matchingController
            }
        });

        // ----------------------------------------------------------------------------------
        // Startup here
        // ----------------------------------------------------------------------------------
        launch();
        //clearLogThenLauch(); // TODO: Just for testing phase

    }, false);

    // ----------------------------------------------------------------------------------
    // Called from resume event
    // ----------------------------------------------------------------------------------
    function resumeAction() {
        window.paused = false;
        if (window.localStorage.sessionId == null) return;
        var resumeTime = new Date;
        var limitPassed = (resumeTime - pauseTime) / 60000 > constants.MAX_RESUME_TIME;
        generalServices.addLogEvent('launchController', '', 'Resume', limitPassed);

        // Check is 2h passed
        if (limitPassed) {

            // Clear Retry/Cancel if on
            $("body").trigger("resumeEvent", []);
            launch();
        }
        else {
            if (!window.changeProfileImage) {
                if (window.nowOnEvents) {
                    // Only get state to check has to close event page
                    stateServices.getState()
                    .then(function (state) {
                        if (state == 'MATCHING') {
                            window.nowOnEvents = false;
                            resumeAction();
                        }
                    });
                } else {
                    // Clear Retry/Cancel if on
                    $("body").trigger("resumeEvent", []);
                    generalServices.addLogEvent('launchController', '', 'Resume', 'Passed resume event call');

                    // This will check has the state really changed
                    stateServices.getStateAndProcess()
                    .then(function () {
                        if (window.state == 'MATCHING') {
                            generalServices.addLogEvent('launchController', '', 'Resume', 'Matching, reload messages');
                            $("body").trigger("getAllMessagesEvent", []);
                        }

                        if (window.state == '' && window.checkedIn == true) {
                            // Extend time from this to 2 hours more. How?
                            userServices.extendCheckIn();
                        }
                    });
                }
            }
        }

    }

    function onOffline() {
        alert('you are OFF line');
    }

    function onOnline() {
        alert('you are ON line');
    }

    // ----------------------------------------------------------------------------------
    // Clear log first. Only for development phase
    // ----------------------------------------------------------------------------------
    function clearLogThenLauch() {
        generalServices.addLogEvent('launchController', 'clearLogThenLauch', 'Start', '');

        generalServices.callRestApi('/clearAllLogEvents')
        .then(function () {
            launch();
        });
    }

    // ----------------------------------------------------------------------------------
    // Launch procedure
    // ----------------------------------------------------------------------------------
    function launch() {
        generalServices.addLogEvent('launchController', 'launch', 'Start', '');
        window.changeProfileImage = false;

        generalServices.callRestApi('/connectionCheck')
        .then(function () {
            generalServices.addLogEvent('launchController', 'launch', 'Connection OK. Account type', window.localStorage.accountType);
            var accountType = window.localStorage.accountType;
            //accountType = ''; // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! POIS    
            if (accountType == 'FB') {
                // Launch by existing FB data

                updateFbUserData();
            } else if (accountType == 'PNM') {
                // Launch by existing PNM sign in data
                validateSessionAndState();
            } else {
                // Open lauch page only. No account type defined
            }
        },
        function () {
            // User selected cancel
            generalServices.popMessage("Connection to PinAndMeet server can't be established. Please check your network connection.");
        });
    }

    // ----------------------------------------------------------------------------------
    // FB SignIn button click on  
    // ----------------------------------------------------------------------------------
    function fbSignIn() {
        generalServices.addLogEvent('launchController', 'fbSignIn', 'Start');
        if (window.localStorage.eulaAccepted != "1") {
            window.localStorage.setItem("eulaAccepted", "1"); // To prevent duplicate ok-cancel bug (I hope)
            var template = '<center>By signing up you agree to the <a href="#" data-tap-disabled="true" style="text-decoration:none; color:blue" onclick="window.open(\'http://pinandmeet.com/terms.html\', \'_system\');">terms of use (EULA).</a></center>';
            generalServices.popMessageOkCancel("Sign up using Facebook", template)
            .then(function () {
                fbSignInExternal();
            },
            function () {
                window.localStorage.setItem("eulaAccepted", "0");
            });
        } else {
            fbSignInExternal();
        }
    }

    function fbSignInExternal() {
        openFB.init({ appId: constants.FB_APP_ID });
        openFB.login(
            function (response) {
                if (response.status === 'connected') {
                    generalServices.addLogEvent('launchController', 'fbSignIn', 'Facebook sign in succeeded', response.authResponse.accessToken);
                    window.localStorage.setItem("fbAccessToken", response.authResponse.accessToken);
                    updateFbUserData();
                } else {
                    generalServices.addLogError('launchController', 'fbSignIn', 'Facebook sign in failed', response.error);
                    generalServices.popMessageOk('Facebook sign in failed. Please try again.');
                }
            },
            { scope: 'user_birthday' }
        );
    }

    // ----------------------------------------------------------------------------------
    // Update FB data. 
    // Can't use generalServices.callRestApi since calling FB service
    // ----------------------------------------------------------------------------------
    function updateFbUserData() {
        generalServices.addLogEvent('launchController', 'updateFbUserData', 'Start');
        userServices.updateFbUserData()
        .then(function () {
            validateSessionAndState();
        },
        function (error) {
            navigator.splashscreen.hide();
            if (error.source == "fb") {
                generalServices.popMessageOk('Facebook data is no longer valid. Please sign in again.');
            } else {
                generalServices.popMessageRetry("Connection to PinAndMeet server can't be established. Please check the network connection.")
                .then(function () {
                    updateFbUserData() // Clicked Yes for Retry -> Call this again
                    .then(function () {
                        resolve();
                    },
                    function () {
                        navigator.splashscreen.hide();
                        reject();
                    });
                },
                function () {
                    // Clicked No for Retry
                    userServices.resetAndStartFromLaunch();
                });
            }
        });
    }

    // ----------------------------------------------------------------------------------
    // Validate sessionId and get a new one if not valid
    // Validate state if one exists on user's data in DB
    // Used by both FB and PNM sign in
    // ----------------------------------------------------------------------------------
    function validateSessionAndState() {
        generalServices.addLogEvent('launchController', 'validateSessionAndState', 'Start');
        userServices.validateSessionAndState()
        .then(function (state) {
            generalServices.addLogEvent('launchController', 'validateSessionAndState', 'Validation completed. Setting state', state);
            initializePushNotification(); // pushHandler.js
            if (window.localStorage.imageUrl == '') {
                generalServices.addLogEvent('launchController', 'validateSessionAndState', 'Open image upload page');
                stateServices.setState('IMAGE_UPLOAD');
            } else {
                stateServices.setState(state);
            }
        },
        function () {
            navigator.splashscreen.hide();
            userServices.resetAndStartFromLaunch();
        });
    }

    // ----------------------------------------------------------------------------------
    // Create pnm account
    // ----------------------------------------------------------------------------------
    function createAccount() {
        generalServices.addLogEvent('launchController', 'createAccount', 'Start');
        stateServices.setState('SIGN_UP');
    }

    // ----------------------------------------------------------------------------------
    // Sign in pnm account
    // ----------------------------------------------------------------------------------
    function signIn() {
        generalServices.addLogEvent('launchController', 'signIn', 'Start');
        stateServices.setState('SIGN_IN');
    }

    // ----------------------------------------------------------------------------------
    // Timed event to send log batch
    // ----------------------------------------------------------------------------------
    function flushLogBatch() {
        if (window.logBatch.length > 0) {
            clearInterval(logBatchInterval);
            generalServices.flushLogBatch();
            window.logBatch = [];
            logBatchInterval = setInterval(flushLogBatch, constants.LOG_BATCH_FLUSH_INTERVAL);
        }
    }
}
