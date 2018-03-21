angular
    .module('app')
    .controller('signInController', signInController);

function signInController($scope, $http, $state, $q, generalServices, userServices, stateServices, constants) {
    $scope.signIn = signIn;
    $scope.forgotPassword = forgotPassword;

    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('signInController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            generalServices.addLogEvent('signInController', '$ionicView.enter', 'Start');
            $scope.email = window.localStorage.lastEmail;
            //$scope.password = "abcdef"; // TODO: For testing only !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        });
    }, false);

    function signIn() {
        generalServices.addLogEvent('signIn', 'signIn', 'Start');
        var email = $('#signin-email').val().trim();
        var password = $('#signin-password').val();
        userServices.signInAndValidateSession(email, password)
        .then(function (state) {
            stateServices.setState(state);
        },
        function (error) {
            if (error == "3") {
                stateServices.setState('EMAIL_NOT_VERIFIED');
            }
        });
    }

    function forgotPassword() {
        generalServices.addLogEvent('signIn', 'forgotPassword', 'Start');
        var email = $('#signin-email').val().trim();
        if (email == "") {
            generalServices.popMessage('Enter your email');
        } else {
            generalServices.popMessageOkCancel('Send new password to ' + email + '?')
            .then(function () {
                userServices.sendNewPasswordEmail(email)
                .then(function () {
                    generalServices.popMessage('New password was sent to ' + email);
                });
            });
        }
    }
}