angular
    .module('app')
    .controller('menuController', menuController);

function menuController($scope, $http, $state, userServices, infoWindowService, $ionicPopup, generalServices, stateServices, constants) {

    $scope.modifyAccount = modifyAccount;
    $scope.signOut = signOut;
    $scope.resetUser = resetUser;
    $scope.pushAlert = pushAlert;
    $scope.myProfile = myProfile;
    $scope.about = about;
    $scope.help = help;
    $scope.openInfoWindow = openInfoWindow;


    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('menuController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            generalServices.addLogEvent('menuController', '$ionicView.enter', 'Start');
            if (window.localStorage.accountType == 'PNM') $('#modifyAccount').show();
        });
    }, false);

    // ----------------------------------------------------------------------
    function openInfoWindow() {
        if (window.state == '') window.open('http://google.com', '_system');
        if (window.state == 'MENU.CHECK_IN') window.open('http://google.com', '_system');
    };

    // ----------------------------------------------------------------------
    function modifyAccount() {
        generalServices.addLogEvent('menuController', 'modifyAccount', 'Start');
        $("body").trigger("stopPositionRefreshInterval", []);
        $("body").trigger("stopPoiRefreshInterval", []);

        stateServices.setState('MENU.MODIFY_ACCOUNT');

        //$state.go("menu.modifyAccount");
    }

    // ----------------------------------------------------------------------
    function myProfile() {
        generalServices.addLogEvent('menuController', 'myProfile', 'Start');
        $("body").trigger("stopPositionRefreshInterval", []);
        $("body").trigger("stopPoiRefreshInterval", []);
        stateServices.setState('MENU.MY_PROFILE');

        //$state.go("menu.myProfile");
    }

    // ----------------------------------------------------------------------
    function resetUser() {
        $("body").trigger("stopPositionRefreshInterval", []);
        $("body").trigger("stopPoiRefreshInterval", []);
        userServices.resetUser();
    }

    // ----------------------------------------------------------------------
    function signOut() {
        generalServices.addLogEvent('menuController', 'signOut', 'Start');
        userServices.signOut()
        .then(function () {
            //$state.go("launch");
            stateServices.setState('LAUNCH');
        }, function () {
            stateServices.setState('LAUNCH');
            //$state.go("launch");
        });
    }

    // ----------------------------------------------------------------------
    function about() {
        generalServices.addLogEvent('menuController', 'about', 'Start');
        window.open('http://pinandmeet.com', '_system');
    }

    // ----------------------------------------------------------------------
    function help() {
        generalServices.addLogEvent('menuController', 'about', 'Start');
        window.open('http://pinandmeet.com/help.html', '_system');
    }

    function pushAlert() {
        // Simulate ste change push message
        //$("body").trigger("pushMessageEvent", ["Jorma", "Hi there"]);
        //$("body").off("pushMessageEvent");
    }
}