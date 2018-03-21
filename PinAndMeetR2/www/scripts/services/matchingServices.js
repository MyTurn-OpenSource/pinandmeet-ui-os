angular
    .module('app')
    .service('matchingServices', matchingServices);

function matchingServices($http, $q, $timeout, generalServices, userServices, constants) { // Do not include stateServices
    this.partnerFound = partnerFound;
    this.getPartnerData = getPartnerData;
    this.partnerNotFound = partnerNotFound;
    this.saveReview = saveReview;
    this.getChatMessages = getChatMessages;
    this.getSingleChatMessage = getSingleChatMessage;

    function getPartnerData() {
        generalServices.addLogEvent('matchingServices', 'getPartnerData', 'Start');

        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };

            generalServices.callRestApi('/getPartner', params)
            .then(function (data) { // Data 
                if (data.error != "") {

                    // Error
                    if (data.error == "ERROR1")
                        userServices.userDataNotFoundHandler();
                    else
                        generalServices.popMessage("The other user has left the venue");

                    reject();
                } else {

                    // Partner was found
                    generalServices.addLogEvent('matchingServices', 'getPartnerData', 'Partner found', data.id);
                    window.partner = data;
                    resolve(data);
                }
            },
            function () { reject(); });
        });
    }

    // Button clicked
    function partnerFound() {
        generalServices.addLogEvent('matchingServices', 'partnerFound', 'Start');
        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };

            generalServices.callRestApi('/partnerFound', params)
            .then(function (data) {
                if (data == "ERROR1" || data == "ERROR2") {
                    reject();
                } else {
                    resolve(data);
                }
            },
            function () { reject(); });
        });
    }

    // Button clicked
    function partnerNotFound() {
        generalServices.addLogEvent('matchingServices', 'partnerNotFound', 'Start');
        return $q(function (resolve, reject) {
            var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel };

            generalServices.callRestApi('/partnerNotFound', params)
            .then(function (data) {
                if (data == "") resolve(); else reject();
            },
            function () { reject(); });
        });
    }

    function saveReview(partnerId, stars, evaluation, blockUser) {
        generalServices.addLogEvent('matchingServices', 'saveReview', 'Start');
        return $q(function (resolve, reject) {
            var params = {
                partnerId: partnerId, sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel,
                stars: stars, evaluation: evaluation, blockUser: blockUser
            };
            generalServices.callRestApi('/saveReview', params)
            .then(function (data) {
                if (data == "ERROR1") {
                    reject();
                } else {
                    resolve(data);
                }
            },
            function () { reject(); });
        });
    }

    function getChatMessages() {
        generalServices.addLogEvent('matchingServices', 'getChatMessages', 'Start');
        return $q(function (resolve, reject) {
            var params = { id: window.localStorage.id, fromId: window.partner.id, loggingLevel: window.localStorage.loggingLevel };

            generalServices.callRestApi('/getChatMessages', params, false)
            .then(function (data) { // Data 
                resolve(data);
            },
            function () { reject(); });
        });
    }

    // Get one message based on messageId
    function getSingleChatMessage(message, from, messageId) {
        generalServices.addLogEvent('matchingServices', 'getSingleChatMessage', 'Start');
        return $q(function (resolve, reject) {
            if (message != '') {
                // Message is included in push message. GPN
                var result = { id: messageId, from: from, message: message };
                resolve(result);
            } else {
                // IOS. Get message data from server
                var params = { id: window.localStorage.id, fromId: window.partner.id, messageId: messageId, sessionId: window.localStorage.sessionId, loggingLevel: window.localStorage.loggingLevel };

                generalServices.callRestApi('/getSingleChatMessages', params)
                .then(function (data) { // Data 
                    if (data == null) {
                        generalServices.addLogError('matchingServices', 'getSingleChatMessage', 'Chat message not found', messageId);
                        reject();
                    } else {
                        resolve(data);
                    }
                },
                function () { reject(); });
            }
        });
    }
}