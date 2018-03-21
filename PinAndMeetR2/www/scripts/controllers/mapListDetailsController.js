angular
    .module('app')
    .controller('mapListDetailsController', mapListDetailsController);

function mapListDetailsController($scope, $http, $state, $q, generalServices, checkInServices, userServices, stateServices, constants) {
    var formLoaded = false;
    $scope.mapListDetails = mapListDetails;
    $scope.openFacebookPage = openFacebookPage;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        if (formLoaded) return; else formLoaded = true;

        generalServices.addLogEvent('mapListDetailsController', 'LOADER', 'Start');

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            if (window.nowMatching) return;
            if (window.localStorage.ripple != "YES") StatusBar.hide(); // Not available on Ripple
            generalServices.addLogEvent('mapListDetailsController', '$ionicView.enter', 'Start');
            $scope.mapListDetails = window.mapListDetails;
        });
    });

    function openFacebookPage() {
        window.open(window.mapListDetails.eventAddressLink, '_system');
    }
}