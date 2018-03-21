angular
    .module('app')
    .controller('myProfileController', myProfileController);

function myProfileController($scope, $http, $state, generalServices, stateServices, userServices, $ionicHistory, constants) {

    $scope.changeProfileImage = changeProfileImage;

    var formLoaded = false;

    // ----------------------------------------------------------------------------
    // Fired when scripts are loaded and device is ready
    // ----------------------------------------------------------------------------
    document.addEventListener("deviceready", function () {
        generalServices.addLogEvent('myProfileController', 'LOADER', 'Start');

        if (formLoaded) return; else formLoaded = true;

        // ----------------------------------------------------------------------------
        // Fired every time this form is opened
        // ----------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            generalServices.addLogEvent('myProfileController', '$ionicView.enter', 'Start');
            if (window.warnedAboutiIS91 == false) {
                window.warnedAboutiIS91 = true;

                // Check that not iOS 9.1
                if (device.platform == 'iOS' && device.version == '9.1') {
                    generalServices.popMessageOk("Your device has iOS version 9.1 which has a know error affecting menu behaviour.<br/><br/>It's highly recommeded to update your device to the latest iOS version.");
                }
            }

            var ls = window.localStorage;
            $scope.name = ls.name;
            $scope.imageUrl = ls.imageUrl;

            userServices.getReviews()
            .then(function (data) {
                $scope.reviews = data;
                if (data == '') $('#noReviews').show(); else $('#noReviews').hide();
            });
        });
    }, false);

    function changeProfileImage() {
        generalServices.addLogEvent('myProfileController', 'changeProfileImage', 'Start');
        window.changeProfileImage = true;
        stateServices.setState('MENU.IMAGE_UPLOAD');
    }
}