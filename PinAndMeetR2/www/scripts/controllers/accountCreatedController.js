angular
    .module('app')
    .controller('accountCreatedController', accountCreatedController);

function accountCreatedController($scope, $http, $state, $q, generalServices, userServices, stateServices, constants) {

    $scope.signIn = signIn;
    $scope.resendVerificationEmail = resendVerificationEmail; 

    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('accountCreatedController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            generalServices.addLogEvent('accountCreatedController', '$ionicView.enter', 'Start');
            if (window.state == "ACCOUNT_CREATED") {
                $('#notVerified').hide();
                $('#accountCreated').show();
            } else {
                $('#accountCreated').hide();
                $('#notVerified').show();
            }
        });

    }, false);

    // --------------------------------------------------------------------------------
    function signIn() {
        stateServices.setState('SIGN_IN');
    }

    // --------------------------------------------------------------------------------
    function resendVerificationEmail() {
        generalServices.addLogEvent('accountCreatedController', 'resendVerificationEmail', 'Start');
        userServices.resendVerificationEmail()
        .then(function () {
            generalServices.popMessage('Verification email was sent')
        });
    }
}