angular
    .module('app')
    .controller('testingController', testingController);

function testingController($scope, $http, $state, $ionicPopup, userServices, $timeout, generalServices, constants) {


    // Triggered on a button click, or some other target
    $scope.showPopup = function () {
        $scope.data = {}

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<input type="password" ng-model="data.wifi">',
            title: 'Enter Wi-Fi Password',
            subTitle: 'Please use normal things',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                  text: '<b>Save</b>',
                  type: 'button-positive',
                  onTap: function (e) {
                      if (!$scope.data.wifi) {
                          //don't allow the user to close unless he enters wifi password
                          e.preventDefault();
                      } else {
                          return $scope.data.wifi;
                      }
                  }
              }
            ]
        });
        myPopup.then(function (res) {
            console.log('Tapped!', res);
        });
    };

    //$("body").on("custom", function (event, param1, param2) {
    //    alert(param1 + "\n" + param2);
    //});





    //$scope.clickTest = function () {
    //    $("body").trigger("custom", ["Jorma", "Pertti"]);

    //}

    //$scope.clickTest2 = function () {
    //    cordova.plugins.Keyboard.show();
    //}

    //var kbd = document.getElementById("myMessage");

    //kbd.addEventListener('click', function () {
    //    setTimeout(function () {
    //        kbd.focus();


    //    }, 400);
    //});

    //var email = $scope.email.toLowerCase();

    //$scope.createAccount = function () {
    //    var age = generalServices.calculateAge($("#birthday").val());
    //    alert(age);
    //}








    //$scope.resizeMessageArea = resizeMessageArea;
    //$scope.showSignInButton = true;
    //var userRating = 0;

    //$scope.ratingsObject = {
    //    iconOn: 'ion-ios-star',
    //    iconOff: 'ion-ios-star-outline',
    //    iconOnColor: 'blue',
    //    iconOffColor: 'grey',
    //    rating: 2,
    //    minRating: 1,
    //    callback: function (rating) {
    //        userRating = rating;
    //    }
    //};

    //$scope.clickTest = function () {
    //    window.open('https://developers.facebook.com/docs/facebook-login/permissions', '_system');
    //}

    //resizeMessageArea();

    //$scope.submit = function () {
    //    alert(userRating);
    //}

    //$scope.messages = [
    //    { id: 1, from: 'Me', message: 'So where are you?' },
    //    { id: 1, from: '', message: 'Im here by the door.' },

    //    { id: 1, from: '', message: 'Im here by the door.' },
    //    { id: 1, from: '', message: 'Im here by the door.' },
    //    { id: 1, from: '', message: 'Im here by the door.' },
    //    { id: 1, from: '', message: 'Im here by the door.' },
    //    { id: 1, from: '', message: 'Im here by the door.' },
    //    { id: 1, from: '', message: 'Im here by the door.' },
    //    { id: 1, from: '', message: 'Im here by the door.' },
    //    { id: 1, from: '', message: 'Im here by the door.' },
    //    { id: 1, from: '', message: 'Im here by the door.' },
    //    { id: 1, from: 'Me', message: 'So where are you?' }
    //];

    //function resizeMessageArea() {
    //    var windowH = $(window).height();
    //    var messageAreaH = windowH - 420;
    //    $('#messageArea').css('height', messageAreaH);
    //}
}