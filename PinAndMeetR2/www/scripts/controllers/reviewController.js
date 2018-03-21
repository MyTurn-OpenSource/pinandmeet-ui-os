angular
    .module('app')
    .controller('reviewController', reviewController);

function reviewController($scope, $http, $state, $q, $ionicModal, generalServices, matchingServices, stateServices, userServices, constants) {

    $scope.saveReview = saveReview;
    $scope.closeReview = closeReview;
    $scope.openReportModal = openReportModal;
    $scope.reportUser = reportUser;
    $scope.closeModal = closeModal;

    var userRating = 5;
    //var interval = null;

    $scope.ratingsObject = {
        iconOn: 'ion-ios-star',
        iconOff: 'ion-ios-star-outline',
        iconOnColor: 'blue',
        iconOffColor: 'grey',
        rating: userRating,
        minRating: 1,
        callback: function (rating) {
            userRating = rating;
        }
    };

    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('reviewController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            generalServices.addLogEvent('reviewController', '$ionicView.enter', 'Start');

            window.checkedIn = false; // Just to make sure
            var partner = window.partner;
            $scope.name = partner.name;
            $scope.imageUrl = partner.imageUrl;
            $('#evaluation').val('');
            //startVenueDistanceCheckInterval();
        });

        // ----------------------------------------------------------------------------
        // Add event listener
        // ----------------------------------------------------------------------------
        //$("body").on("stopReviewVenueDistanceCheckInterval", function (event) {
        //    stopVenueDistanceCheckInterval();
        //});
    }, false);

    // ----------------------------------------------------------------------------
    function saveReview() {
        generalServices.addLogEvent('reviewController', 'saveReview', 'Start');
        var evaluation = $('#evaluation').val();
        var blockUser = $('#blockUser').is(':checked');
        matchingServices.saveReview(window.partner.id, userRating, evaluation, blockUser)
        .then(function (data) {
            if (data == '') {
                userServices.resetUser()
                .then(function () {
                    stateServices.setState('');
                });
            }
        });
    }

    // ----------------------------------------------------------------------------
    function closeReview() {
        generalServices.addLogEvent('reviewController', 'closeReview', 'Start');
        userServices.resetUser(); // Async, so the app dont freeze on this page in case of no network conn
        stateServices.setState('');
    }

    // ----------------------------------------------------------------------------
    // Report related
    // ----------------------------------------------------------------------------

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

    //// ----------------------------------------------------------------------------
    //// Start venue check refresh interval
    //// ----------------------------------------------------------------------------
    //function startVenueDistanceCheckInterval() {
    //    if (interval != null) return;
    //    generalServices.addLogEvent('reviewController', 'startVenueDistanceCheckInterval', 'Start');
    //    interval = setInterval(checkVenueDistance, constants.VENUE_DISTANCE_CHECK_INTERVAL);
    //}

    //// ----------------------------------------------------------------------------
    //// Check distance from the venue
    //// ----------------------------------------------------------------------------
    //function checkVenueDistance() {
    //    if (window.paused) return;
    //    generalServices.addLogEvent('reviewController', 'checkVenueDistance', 'Start');
    //    stopVenueDistanceCheckInterval();

    //    generalServices.getDistanceFromVenue()
    //    .then(function (distance) {
    //        if (distance > constants.MAX_CHECK_IN_VENUE_DISTANCE) {
    //            userServices.setVenueOutOfRange();
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
    //    generalServices.addLogEvent('reviewController', 'stopVenueDistanceCheckInterval', 'Start');
    //    clearInterval(interval);
    //    interval = null;
    //}
}