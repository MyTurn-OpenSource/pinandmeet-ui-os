angular
    .module('app')
    .controller('confirmImageController', confirmImageController);

function confirmImageController($scope, $http, $state, $q, generalServices, userServices, stateServices, $ionicHistory, $timeout, constants) {
    $scope.useThis = useThis;
    $scope.reject = reject;

    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('confirmImageController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            generalServices.addLogEvent('confirmImageController', '$ionicView.enter', 'Start');
            $('#profilePicture').attr('src', window.possibleImageUrl);
        });
    }, false);

    function reject() {
        generalServices.addLogEvent('confirmImageController', 'reject', 'Start', '');
        $ionicHistory.goBack();
    }

    function useThis() {
        generalServices.addLogEvent('confirmImageController', 'reject', 'useThis', '');
        userServices.setProfileImageUrl(window.possibleImageUrl)
        .then(function () {
            if (window.changeProfileImage) generalServices.popMessage('Profile picture updated');
            stateServices.setState(''); // Map
        });
    }
}