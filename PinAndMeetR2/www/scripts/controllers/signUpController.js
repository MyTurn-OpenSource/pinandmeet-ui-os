angular
    .module('app')
    .controller('signUpController', signUpController);

function signUpController($scope, $http, $state, $q, generalServices, userServices, stateServices, constants) {

    // TODO: For testing only
    //$scope.firstName = "Niko";
    //$scope.lastName = "Wessman";
    //$scope.password = "abcdef";
    //$scope.email = "niko.wessman@nsd.fi";
    //$scope.birthday = "1990-01-01";

    $scope.createAccount = createAccount;
    //$scope.cancel = cancel;

    function createAccount() {
        generalServices.addLogEvent('signUpController', 'createAccount', 'Start');
        var firstName = $('#signup-firstName').val();
        var lastName = $('#signup-lastName').val();
        var email = $('#signup-email').val();
        var birthday = $('#signup-birthday').val();
        var password = $('#signup-password').val();
        var age = generalServices.calculateAge(birthday);

        //if (age < 18) {
        //    generalServices.popMessageOk('Sorry. You must be at least 18 years old to create an account.')
        //    return;
        //}

        // Checks
        userServices.createAccount(firstName, lastName, email, birthday, password)
        .then(function () {
            stateServices.setState('ACCOUNT_CREATED');
        });
    }

    //function cancel() {
    //    stateServices.setState('LAUNCH');
    //}
}