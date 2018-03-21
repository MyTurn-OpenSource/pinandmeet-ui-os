angular
    .module('app')
    .controller('matchingController', matchingController);

function matchingController($scope, $http, $state, $q, $ionicScrollDelegate, $timeout, generalServices, matchingServices, userServices, $ionicPopup, stateServices, $ionicModal, $ionicPopover, constants) {

    $scope.enterMessage = enterMessage;
    $scope.partnerNotFound = partnerNotFound;
    $scope.partnerFound = partnerFound;
    $scope.showTypePopup = showTypePopup;
    $scope.quickySelected = quickySelected;
    $scope.showQuickyPopup = showQuickyPopup;
    $scope.openPopover = openPopover;
    $scope.openReportModal = openReportModal;
    $scope.reportUser = reportUser;
    $scope.closeModal = closeModal;

    //var interval = null;

    var popHeight;
    var quickyPopup;
    var mayResize = true; // This is needes since in some device this event keeps popping many times per second

    $scope.pops = [
        { message: 'Hi' },
        { message: "So where are you?" },
        { message: "Could you stand up?" },
        { message: "Could you come over here?" },
        { message: "I'm now standing up" },
        { message: "I'm standing by the front door" },
        { message: "I'm at a table by the window" },
        { message: "I'm at a table by the door" },
        { message: "I'm at a table next to counter" },
        { message: "Now I see you" },
        { message: "I'll be right there" },
        { message: "OK" },
        { message: "Sure" },
        { message: "Yes" },
        { message: "No" }
    ];

    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('matchingController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------------
        // Add event listener
        // ----------------------------------------------------------------------------------
        $(window).resize(resizeMessageArea); // On gloval resize event, call resizeMessageArea()

        // ----------------------------------------------------------------------------------
        // Add event listener
        // ----------------------------------------------------------------------------------
        $("body").on("getAllMessagesEvent", function (event) {
            getAllMessages();
        });

        // ----------------------------------------------------------------------------------
        // Add event listener
        // Raised from pushHandler.js
        // title == Sender name
        // ----------------------------------------------------------------------------------
        $("body").on("pushMessageEvent", function (event, title, message, messageId) {
            generalServices.addLogEvent('matchingController', 'pushMessageEvent', 'Start', title + ' ' + message + ' ' + messageId + ' ' + partner.name);

            if (title != "Pin'n'Meet") {
                matchingServices.getSingleChatMessage(message, title, messageId)
                .then(function (data) {
                    // Chat event
                    //generalServices.addLogEvent("Updating as: " + JSON.stringify(data));
                    if (title == partner.name) {
                        // Chat message from the partner
                        // NOTE: $scope.$apply(function () { is not available here, why?
                        $scope.messages.push({ id: 1, from: title, message: data.message });
                    } else {
                        // Chat message from someone else? Should not come
                        generalServices.popMessageOk(title, data.message);
                    }
                    $ionicScrollDelegate.$getByHandle('small').scrollBottom();
                });
            } else {
                // Change state event
                // Catch by launchController
            }
        });

        // ----------------------------------------------------------------------------
        // Add event listener
        // ----------------------------------------------------------------------------
        //$("body").on("stopMatchingVenueDistanceCheckInterval", function (event) {
        //    stopVenueDistanceCheckInterval();
        //});

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            generalServices.addLogEvent('matchingController', '$ionicView.enter', 'Start');

            window.checkedIn = false;
            mayResize = true;
            var partner = window.partner; // <-- Defined in stateServices
            $scope.name = partner.name;
            $scope.imageUrl = partner.imageUrl;

            resizeMessageArea();
            getAllMessages();
            //startVenueDistanceCheckInterval();
        });
    }, false);

    // ----------------------------------------------------------------------------------
    function getAllMessages() {
        generalServices.addLogEvent('matchingController', 'getAllMessages', 'Start');
        matchingServices.getChatMessages()
        .then(function (data) {
            $scope.messages = data;
            $ionicScrollDelegate.$getByHandle('small').scrollBottom();
        });
    }

    // ----------------------------------------------------------------------------------
    function showTypePopup() {
        generalServices.addLogEvent('matchingController', 'showTypePopup', 'Start');
        $scope.data = {}

        // An elaborate, custom popup
        var typePopup = $ionicPopup.show({
            template: '<input id="newMessage" type="text" ng-model="data.newMessage" style="padding:5px 10px">',
            title: 'Type your message',
            scope: $scope,
            buttons: [
              { text: 'Close', type: 'button-positive' },
              {
                  text: 'Send',
                  type: 'button-positive',
                  onTap: function (e) {
                      if (!$scope.data.newMessage) {
                          e.preventDefault();
                      } else {
                          return $scope.data.newMessage;
                      }
                  }
              }
            ]
        });
        //$('#newMessage').keyup(function (e) {
        //    if (e.keyCode == 13) {
        //        typePopup.close();
        //    };
        //});
        typePopup.then(function (result) {
            if (result) enterMessage(false, result);
        });
    };

    function quickySelected(item) {
        generalServices.addLogEvent('matchingController', 'quickySelected', 'Start');
        quickyPopup.close();
        enterMessage(false, item.message);
    }

    // ----------------------------------------------------------------------------------
    // Triggered on a button click, or some other target
    // ----------------------------------------------------------------------------------
    function showQuickyPopup() {
        generalServices.addLogEvent('matchingController', 'showQuickyPopup', 'Start');

        $scope.data = {}
        $scope.popHeight = popHeight + 'px';

        // An elaborate, custom popup
        quickyPopup = $ionicPopup.show({
            //template: '<input type="password" ng-model="data.wifi">',
            templateUrl: 'templates/chatPopup.html',
            title: 'Quick message',
            scope: $scope,
            buttons: [
              { text: 'Close', type: 'button-positive' }
            ]
        });
    };


    // ----------------------------------------------------------------------------------
    function partnerFound() {
        generalServices.addLogEvent('matchingController', 'partnerFound', 'Start');
        //stopVenueDistanceCheckInterval();
        matchingServices.partnerFound()
        .then(function (data) {
            //if (data == '')
            //    $('#partnerFound').hide();
            //else
            //$("body").off("pushMessageEvent");
            stateServices.setState('REVIEW');
        });
    }

    // ----------------------------------------------------------------------------------
    function partnerNotFound() {
        generalServices.addLogEvent('matchingController', 'partnerNotFound', 'Start');
        //stopVenueDistanceCheckInterval();
        matchingServices.partnerNotFound()
        .then(function () {
            //$("body").off("pushMessageEvent");
            stateServices.setState('');
        }, function () {
            // Same even if error, otherwise stuck on this page
            //$("body").off("pushMessageEvent");
            stateServices.setState('');
        });
    }

    // ----------------------------------------------------------------------------------
    function enterMessage(fromButton, newMessage) {

        generalServices.addLogEvent('matchingController', 'enterMessage', 'Start', newMessage);
        //var msg = $('#myMessage').val();
        msg = newMessage;
        fromButton = true;
        var postData = {
            sessionId: window.localStorage.sessionId,
            id: window.localStorage.id,
            toId: window.partner.id,
            message: msg
        }
        if (fromButton) {
            $scope.messages.push({ id: 1, from: 'Me', message: msg });
        } else {
            // From Enter
            $scope.$apply(function () {
                $scope.messages.push({ id: 1, from: 'Me', message: msg });
            });
        }

        $ionicScrollDelegate.$getByHandle('small').scrollBottom();
        message: $('#myMessage').val('');

        // Add to partner's queue
        generalServices.callRestApi('/sendMessage', postData, true, false)
        .then(function (result) {
            if (result != "") {
                // TODO: Error 
            }
        });

        checkHasConnectionTypeChanged();

    }

    // ----------------------------------------------------------------------------------
    function resizeMessageArea() {
        if (mayResize == false) return;
        mayResize = false;

        generalServices.addLogEvent('matchingController', 'resizeMessageArea', 'Start');
        var windowH = $(window).height();
        var messageAreaH = windowH - 390;
        if (messageAreaH < 100) messageAreaH = 100;
        $('#messageArea').css('height', messageAreaH);
        popHeight = windowH - 200;

        // This is needes since in some device this event keeps popping many times per second
        $timeout(function () {
            mayResize = true;
        }, 5000);
    }

    var template = '<ion-popover-view style="height:220px;"><img src="' + window.partner.imageUrl + '" style="width:100%; border:1px solid black"/></ion-popover-view>';

    // Show partner image bigger
    $scope.popover = $ionicPopover.fromTemplate(template, {
        scope: $scope
    });

    function openPopover ($event) {
        $scope.popover.show($event);
    };

    $ionicModal.fromTemplateUrl('reportModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modal = modal;
    });

    function openReportModal($event) {
        $('#reportDescription').val('');
        $scope.modal.show();
    }

    function reportUser() {
        var desc = $('#reportDescription').val();
        userServices.reportUser(desc);
        closeModal();
        generalServices.popMessage('Your report was sent and will be examined shortly by the supervision team', '', 5000);
    }

    function closeModal() {
        $scope.modal.hide();
    }

    // ----------------------------------------------------------------------------
    // Start venue check refresh interval
    // ----------------------------------------------------------------------------
    //function startVenueDistanceCheckInterval() {
    //    generalServices.addLogEvent('matchingController', 'startVenueDistanceCheckInterval', 'REMOVE THIS');
    //    if (interval != null) return;
    //    generalServices.addLogEvent('matchingController', 'startVenueDistanceCheckInterval', 'Start');
    //    interval = setInterval(checkVenueDistance, constants.VENUE_DISTANCE_CHECK_INTERVAL);
    //}

    // ----------------------------------------------------------------------------
    // Check distance from the venue
    // ----------------------------------------------------------------------------
    //function checkVenueDistance() {
    //    if (window.paused) return;

    //    generalServices.addLogEvent('matchingController', 'checkVenueDistance', 'Start');
    //    stopVenueDistanceCheckInterval();

    //    generalServices.getDistanceFromVenue()
    //    .then(function (distance) {
    //        if (distance > constants.MAX_CHECK_IN_VENUE_DISTANCE) {
    //            userServices.setVenueOutOfRange()
    //            .then(function () {
    //                //generalServices.popMessage('Your distance from the venue is more than ' + constants.MAX_CHECK_IN_VENUE_DISTANCE + ' meters');
    //            }, function () {
    //                // Should not happen
    //                generalServices.addLogError('matchingController', 'checkVenueDistance', 'Out of venue rejected');
    //                startVenueDistanceCheckInterval();
    //            });
    //            // No sense starting distance check again
    //        } else {
    //            startVenueDistanceCheckInterval();
    //        }
    //    },
    //    function () {
    //        startVenueDistanceCheckInterval();
    //    });
    //}

    //// ----------------------------------------------------------------------------
    //// Stop venue check refresh interval
    //// ----------------------------------------------------------------------------
    //function stopVenueDistanceCheckInterval() {
    //    if (interval == null) return;
    //    generalServices.addLogEvent('matchingController', 'stopVenueDistanceCheckInterval', 'Start');
    //    clearInterval(interval);
    //    interval = null;
    //}
}