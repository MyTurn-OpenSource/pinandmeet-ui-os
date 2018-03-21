angular
    .module('app')
    .controller('modifyAccountController', modifyAccountController);

function modifyAccountController($scope, $http, $state, generalServices, stateServices, userServices, $ionicHistory, constants) {

    $scope.updateAccount = updateAccount;
    $scope.deleteAccount = deleteAccount;


    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('modifyAccountController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            generalServices.addLogEvent('modifyAccountController', '$ionicView.enter', 'Start');

            var ls = window.localStorage;
            $scope.firstName = ls.first_name;
            $scope.lastName = ls.last_name;
            $scope.email = ls.email;
            $('#birthday').val(ls.birthday); // Must be like this
        });
    }, false);

    // ----------------------------------------------------------------------------
    function updateAccount() {
        generalServices.addLogEvent('modifyAccountController', 'updateAccount', 'Start');
        var firstName = $('#firstName').val();
        var lastName = $('#lastName').val();
        var email = $('#email').val();
        var birthday = $('#birthday').val();
        var password = $('#password').val();
        var age = generalServices.calculateAge(birthday);
        //if (age < 18) {
        //    generalServices.popMessageOk('Sorry. You must be at least 18 years old to create an account.')
        //    return;
        //}

        if (password.length > 0 && password.length < 6) {
            generalServices.popMessage('Password minimum lenght is 6 characters')
            return;
        }
        //generalServices.addLogEvent("Account updated: " + email + " " + $scope.email);

        // Checks
        userServices.updateAccount(firstName, lastName, email, birthday, password, false)
        .then(function () {

            window.localStorage.setItem("first_name", firstName);
            window.localStorage.setItem("last_name", lastName);
            window.localStorage.setItem("birthday", birthday);
            window.localStorage.setItem("email", email);
            generalServices.popMessage('Account updated');
            $ionicHistory.goBack();// Back
        });
    }

    // ----------------------------------------------------------------------------
    function deleteAccount() {
        generalServices.addLogEvent('modifyAccountController', 'deleteAccount', 'Start');
        generalServices.popMessageOkCancel('Are you sure you want to delete this account?')
        .then(function () {
            var ls = window.localStorage;
            userServices.updateAccount(ls.first_name, ls.last_name, ls.email, ls.birthday, "", true)
            .then(function () {
                generalServices.popMessageOk('Your account was deleted.<br/>You can reactivate the account by signing in.');
                userServices.signOut();
                stateServices.setState('LAUNCH');
                //$state.go("launch");
            });
        });

    }
}