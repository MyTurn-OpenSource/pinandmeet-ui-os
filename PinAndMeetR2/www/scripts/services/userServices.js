angular
    .module('app')
    .service('userServices', userServices);

// ------------------------------------------------------------------------------
// User related services
// ------------------------------------------------------------------------------

function userServices($http, $q, $timeout, $ionicHistory, $state, generalServices, constants) { // NO: stateServices

    this.updateFbUserData = updateFbUserData;
    this.validateSessionAndState = validateSessionAndState;
    this.resetAndStartFromLaunch = resetAndStartFromLaunch;
    this.resetUser = resetUser;
    this.createAccount = createAccount;
    this.updateAccount = updateAccount;
    this.resendVerificationEmail = resendVerificationEmail;
    this.signInAndValidateSession = signInAndValidateSession;
    this.setProfileImageUrl = setProfileImageUrl;
    this.sendNewPasswordEmail = sendNewPasswordEmail;
    this.signOut = signOut;
    this.getReviews = getReviews;
    this.setVenueOutOfRange = setVenueOutOfRange;
    this.userDataNotFoundHandler = userDataNotFoundHandler;
    this.reportUser = reportUser;
    this.extendCheckIn = extendCheckIn;

    // ----------------------------------------------------------------------------------
    // Get FB data from Facebook service, save in localStorage and update in PnM service
    // ----------------------------------------------------------------------------------
    function updateFbUserData() {
        return $q(function (resolve, reject) {
            var ls = window.localStorage;
            generalServices.addLogEvent('userServices', 'updateFbUserData', 'Start', ls.fbAccessToken);
            var oldSessionId = ls.sessionId;

            // Update FB data. If not found, sign in needed
            openFB.init({ appId: constants.FB_APP_ID, accessToken: ls.fbAccessToken });
            openFB.api({
                path: '/me',
                success: function (fbData) {
                    var userData = { fbData: fbData, device: device, fbAccessToken: ls.fbAccessToken };
                    generalServices.addLogEvent('userServices', 'updateFbUserData', 'FB data received', JSON.stringify(userData));
                    var imageUrl = "http://graph.facebook.com/" + fbData.id + "/picture?type=large";
                    userData.fbData.imageUrl = imageUrl;
                    userData.fbData.localTimeStamp = generalServices.getLocalTimeStamp();

                    var fbAccessToken = window.localStorage.fbAccessToken;
                    clearLocalStorageAndHistory(true);
                    window.localStorage.setItem("fbAccessToken", fbAccessToken);

                    // Update FB data in local storeage
                    window.localStorage.setItem("fbData", JSON.stringify(fbData));
                    window.localStorage.setItem("accountType", "FB");
                    window.localStorage.setItem("id", fbData.id);
                    window.localStorage.setItem("name", fbData.name);
                    window.localStorage.setItem("imageUrl", imageUrl);
                    window.localStorage.setItem("sessionId", oldSessionId);

                    generalServices.spinner(true);
                    // Save data into service database
                    //generalServices.addLogEvent("Sending to server for update ");
                    //generalServices.addLogEvent("Sending to server for update see data " + JSON.stringify(fbData));

                    // Wait 1 sec to avoid async bug
                    $timeout(function () {
                        $.ajax({
                            url: constants.SERVICE_URL + "/updateFbUserData",
                            type: "POST",
                            dataType: "json",
                            contentType: "application/json",
                            data: JSON.stringify(userData),
                            timeout: constants.REST_CALL_TIMEOUT
                        })
                        .success(function (data, status, headers, config) {
                            generalServices.spinner(false);
                            generalServices.addLogEvent('userServices', 'updateFbUserData', 'User data updated', data);
                            if (data == "") {
                                generalServices.addLogEvent('userServices', 'updateFbUserData', 'Resolve', data);
                                resolve();
                            } else {
                                // Banned
                                generalServices.popMessage(data);
                                reject();
                            }
                        })
                        .error(function (data, status, headers, config) {
                            generalServices.spinner(false);
                            generalServices.addLogError('userServices', 'updateFbUserData', 'User data not be updated', JSON.stringify(data));
                            reject({ source: 'pnm' });
                        });
                    }, 1000);

                },
                error: function (error) {
                    // FB data not found
                    generalServices.spinner(false);
                    generalServices.addLogError('userServices', 'updateFbUserData', 'FB data not found', JSON.stringify(error));
                    reject({ source: 'fb' });
                }
            });
        });
    }

    // ----------------------------------------------------------------------------------
    // Validate sessionId and get a new one if not valid
    // Validate state if one exists on user's data in DB
    // ----------------------------------------------------------------------------------
    function validateSessionAndState() {
        generalServices.addLogEvent('userServices', 'validateSessionAndState', 'Start');
        return $q(function (resolve, reject) {

            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id };

            generalServices.callRestApi('/validateSessionAndState', params)
            .then(function (data) { // Data 
                if (data.errorCode != "") {
                    generalServices.addLogError('userServices', 'validateSessionAndState', 'Error', data.errorCode);

                    // Error
                    if (data.errorCode == "1") userDataNotFoundHandler();
                    if (data.errorCode == "2") generalServices.popMessageOk(data.error); // Banned

                    reject();
                    return;
                } else if (data.sessionId == window.localStorage.sessionId) {

                    // Old session is OK
                    generalServices.addLogEvent('userServices', 'validateSessionAndState', 'Session validated. Valid sessionId');
                    window.localStorage.setItem("imageUrl", data.imageUrl);
                    window.localStorage.setItem("loggingLevel", data.loggingLevel);
                } else {

                    // New session started
                    generalServices.addLogEvent('userServices', 'validateSessionAndState', 'Session validated. New sessionId', data.sessionId);
                    window.localStorage.setItem("imageUrl", data.imageUrl);
                    window.localStorage.setItem("loggingLevel", data.loggingLevel);
                    window.localStorage.setItem("sessionId", data.sessionId); // Set new sessionId

                    window.localStorage.removeItem("lastVenueLat");
                    window.localStorage.removeItem("lastVenueLng");
                }

                // Get user data for modify account page
                var state = data.state;
                if (state == "CHECKED_IN") {
                    state = '';
                    window.checkedIn = true;
                }
                resolve(state);
            },
            function () { reject(); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Reset user when match and review is over
    // ----------------------------------------------------------------------------------
    function resetUser() {
        generalServices.addLogEvent('userServices', 'resetUser', 'Start');

        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };

            generalServices.callRestApi('/resetUser', params)
            .then(function (data) { // Data 

                window.localStorage.removeItem("lastVenueLat");
                window.localStorage.removeItem("lastVenueLng");

                if (data != "") {
                    generalServices.popMessage("Unable to reset user.");
                    reject();
                } else {
                    resolve();
                }
            },
            function () { reject(); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Create pnm account
    // ----------------------------------------------------------------------------------
    function createAccount(firstName, lastName, email, birthday, password) {
        return $q(function (resolve, reject) {
            var passwordHash = CryptoJS.MD5('sikapossu' + password).toString();
            var params = { firstName: firstName, lastName: lastName, email: email, birthday: birthday, passwordHash: passwordHash, localTimeStamp: generalServices.getLocalTimeStamp() };
            generalServices.addLogEvent('userServices', 'createAccount', 'Start', JSON.stringify(params));

            generalServices.callRestApi('/signUp', params)
            .then(function (data) { // Data 
                if (data != "") {
                    generalServices.addLogEvent('userServices', 'createAccount', data);

                    // Error
                    generalServices.popMessageOk(data);
                    reject();
                } else {

                    // New account created
                    generalServices.addLogEvent('userServices', 'createAccount', 'Account created');
                    window.localStorage.setItem("lastEmail", email); // Stored so resend verification can be done and default on sign in page
                    resolve();
                }
            },
            function (error) { reject(error); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Update pnm account
    // ----------------------------------------------------------------------------------
    function updateAccount(firstName, lastName, email, birthday, password, deleted) {
        return $q(function (resolve, reject) {
            var passwordHash;
            if (password == "")
                passwordHash = ""
            else
                passwordHash = CryptoJS.MD5('sikapossu' + password).toString();

            var params = {
                sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel,
                firstName: firstName, lastName: lastName, email: email, birthday: birthday, passwordHash: passwordHash, deleted: deleted
            };
            generalServices.addLogEvent('userServices', 'updateAccount', 'Start', JSON.stringify(params));


            generalServices.callRestApi('/updateAccount', params)
            .then(function (data) { // Data 
                if (data != "") {
                    generalServices.addLogEvent('userServices', 'updateAccount', data);

                    // Error
                    generalServices.popMessageOk(data);
                    reject();
                } else {
                    resolve();
                }
            },
            function (error) { reject(error); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Resend verification email
    // ----------------------------------------------------------------------------------
    function resendVerificationEmail() {
        return $q(function (resolve, reject) {
            var email = window.localStorage.lastEmail;
            generalServices.addLogEvent('userServices', 'resendVerificationEmail', 'Start', email);

            var params = { email: email };

            generalServices.callRestApi('/resendVerificationEmail', params)
            .then(function (data) { // Data 
                if (data != "") {
                    generalServices.addLogEvent('userServices', 'updateAccount', data);

                    // Error
                    generalServices.popMessageOk(data);
                    reject();
                } else {
                    generalServices.addLogEvent('userServices', 'resendVerificationEmail', 'Completed');
                    resolve();
                }
            },
            function (error) { reject(error); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Sign in using PNM account and validate session
    // ----------------------------------------------------------------------------------
    function signInAndValidateSession(email, password) {
        return $q(function (resolve, reject) {
            generalServices.addLogEvent('userServices', 'signInAndValidateSession', 'Start', email);

            var passwordHash = CryptoJS.MD5('sikapossu' + password).toString();
            //alert(password + " " + passwordHash);
            var params = { email: email, passwordHash: passwordHash, device: device, localTimeStamp: generalServices.getLocalTimeStamp() };
            window.localStorage.setItem("lastEmail", email);

            generalServices.callRestApi('/signIn', params)
            .then(function (data) { // Data 
                if (data.error == "1" || data.error == "2" || data.error == "4") {
                    // User not found (1) or invalid password (2)
                    generalServices.addLogEvent('userServices', 'signInAndValidateSession', data.errorCode);
                    generalServices.popMessageOk(data.errorCode);
                    reject("");
                } else if (data.error == "3") {
                    generalServices.popMessage("Email not verified");
                    // Email not verified (3)
                    reject("3");
                } else {
                    // No errors. Signed in and session verified
                    // New session started
                    generalServices.addLogEvent('userServices', 'signInAndValidateSession', 'Session validated. New sessionId', data.sessionId);
                    window.localStorage.setItem("accountType", "PNM");
                    window.localStorage.setItem("id", data.id);
                    window.localStorage.setItem("sessionId", data.sessionId); // Set new sessionId
                    window.localStorage.setItem("imageUrl", data.imageUrl); // Set new sessionId

                    window.localStorage.setItem("first_name", data.first_name);
                    window.localStorage.setItem("last_name", data.last_name);
                    window.localStorage.setItem("birthday", data.birthday);
                    window.localStorage.setItem("email", data.email);
                    window.localStorage.setItem("loggingLevel", data.loggingLevel);

                    generalServices.addLogEvent('userServices', 'signInAndValidateSession', 'Ripple', window.localStorage.ripple);

                    initializePushNotification(); // pushHandler.js

                    if (data.imageUrl == "") {
                        if (window.localStorage.ripple == "YES") { // For testing only
                            generalServices.addLogEvent('userServices', 'signInAndValidateSession', 'Ripple. Skip image upload');
                            setProfileImageUrl('http://graph.facebook.com/10153374187653948/picture?type=large')
                            .then(function () {
                                generalServices.popMessage('Ripple on');
                                resolve(''); // Map
                            });
                        } else {
                            generalServices.addLogEvent('userServices', 'signInAndValidateSession', 'Start image upload');
                            resolve('IMAGE_UPLOAD');
                        }
                    }
                    else {
                        resolve(data.state);
                    }
                }
            },
            function (error) { reject(""); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Set profile image
    // ----------------------------------------------------------------------------------
    function setProfileImageUrl(imageUrl) {
        generalServices.addLogEvent('userServices', 'setProfileImageUrl', 'Start image upload', imageUrl);

        window.localStorage.setItem("imageUrl", window.possibleImageUrl);

        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel, imageUrl: imageUrl };
            generalServices.callRestApi('/setProfileImageUrl', params)
            .then(function (data) { // Data 
                if (data != "") {
                    reject();
                } else {
                    resolve();
                }
            },
            function (error) { reject(""); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Get reviews for My Profile page
    // ----------------------------------------------------------------------------------
    function getReviews() {
        generalServices.addLogEvent('userServices', 'getReviews', 'Start');

        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };

            generalServices.callRestApi('/getReviews', params, false)
            .then(function (data) { // Data 
                resolve(data);
            },
            function () { reject(); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Send new password
    // ----------------------------------------------------------------------------------
    function sendNewPasswordEmail(email) {
        generalServices.addLogEvent('userServices', 'sendNewPasswordEmail', 'Start', email);
        return $q(function (resolve, reject) {
            var params = { email: email };
            generalServices.callRestApi('/sendNewPasswordEmail', params)
            .then(function (data) { // Data 
                if (data != "") {
                    reject();
                } else {
                    resolve();
                }
            },
            function (error) { reject(""); });
        });
    }


    // ----------------------------------------------------------------------------------
    // Extend check in time (set as datetime.utcnow
    // ----------------------------------------------------------------------------------
    function extendCheckIn() {
        generalServices.addLogEvent('userServices', 'extendCheckIn', 'Start');

        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };
            generalServices.callRestApi('/extendCheckIn', params)
            .then(function (data) { // Data 
                if (data != "") {
                    reject();
                } else {
                    resolve();
                }
            },
            function (error) { reject(""); });
        });
    }


    // ----------------------------------------------------------------------------------
    // Sign out user
    // ----------------------------------------------------------------------------------
    function signOut() {
        generalServices.addLogEvent('userServices', 'signOut', 'Start');
        return $q(function (resolve, reject) {
            // Don't put stateService here, can't be called from this module

            $("body").trigger("stopPositionRefreshInterval", []);
            $("body").trigger("stopPoiRefreshInterval", []);

            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };

            clearLocalStorageAndHistory();
            generalServices.callRestApi('/signOut', params, true, true, false)
            .then(function (data) { // Data 
                if (data != "") {
                    reject();
                } else {
                    resolve();
                }
            },
            function () { reject(); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Handel situation when user data is not found. Usually is logged with same id on another device
    // ----------------------------------------------------------------------------------
    function userDataNotFoundHandler() {
        generalServices.addLogEvent('userServices', 'userDataNotFoundHandler', 'Start');
        //signOut(); Don't do
        clearLocalStorageAndHistory();
        generalServices.popMessageOk("You have signed in on some other device and automatically signed out from this device.");
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
        window.state = 'LAUNCH';
        $state.go("launch");
    }

    // ----------------------------------------------------------------------------------
    // Set venue out of range = true
    // ----------------------------------------------------------------------------------
    function setVenueOutOfRange() {
        generalServices.addLogEvent('userServices', 'setVenueOutOfRange', 'Start');
        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };
            generalServices.callRestApi('/setVenueOutOfRange', params, true, true, false)
            .then(function (data) { // Data 
                if (data != "") {
                    reject();
                } else {
                    resolve();
                }
            },
            function () { reject(); });
        });
    }

    // ----------------------------------------------------------------------------------
    // Send inappr report
    // ----------------------------------------------------------------------------------
    function reportUser(description) {
        var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel, targetUserId: window.partner.id, description: description };
        generalServices.callRestApi('/reportUser', params, true, false)
    }

    // ----------------------------------------------------------------------------------
    // Clear localstorage and go on a launch page
    // ----------------------------------------------------------------------------------
    function resetAndStartFromLaunch() {
        generalServices.addLogEvent('userServices', 'resetAndStartFromLaunch', 'Start');
        clearLocalStorageAndHistory();
        window.state = "LAUNCH";
        $state.go("launch");
        $("body").trigger("stopPoiRefreshInterval", []);
        // Don't put stateService here, can't be called from this module
    }

    // ----------------------------------------------------------------------------------
    // Clear all
    // ----------------------------------------------------------------------------------
    function clearLocalStorageAndHistory() {
        generalServices.addLogEvent('userServices', 'clearLocalStorageAndHistory', 'Start');
        //window.localStorage.clear(); // This would disable Ripple
        window.localStorage.removeItem("accountType");
        window.localStorage.removeItem("id");
        window.localStorage.removeItem("sessionId");
        window.localStorage.removeItem("loggingLevel");
        window.localStorage.removeItem("fbAccessToken");
        window.localStorage.removeItem("fbData");
        window.localStorage.removeItem("imageUrl");
        window.localStorage.removeItem("ripple");
        window.localStorage.removeItem("eulaAccepted");
        window.localStorage.removeItem("first_name");
        window.localStorage.removeItem("last_name");
        window.localStorage.removeItem("birthday");
        window.localStorage.removeItem("email");
        window.localStorage.removeItem("lastVenueLat");
        window.localStorage.removeItem("lastVenueLng");
        window.state = '';
        window.checkedIn = false;
        window.possibleImageUrl = null;
        window.nowOnEvents = false;
 
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();
    }
}