angular
    .module('app', ['ionic', 'ionic-ratings'])
    .run(appRun)
    .config(appConfig)

    // Push plugin old (vain Android): https://github.com/phonegap-build/PushPlugin.git
    // Push plugin new (vain iOS): https://github.com/phonegap/phonegap-plugin-push
    // Telerik version: https://github.com/Telerik-Verified-Plugins/PushNotification ?
    // http://docs.pushwoosh.com/ 

    // GCM: See pushHandler.js and PnMService PushHelpers.SendGcmNotification

    // https://foursquare.com/developers/app/HIYCB1CF5ETHPGEXPYCFKHLVZB0OUW04TIPSIVC5OKXG4SCO
    // Endpoints:https://developer.foursquare.com/docs/
    // Api explorer: https://developer.foursquare.com/docs/explore
    // Search by id: https://developer.foursquare.com/docs/explore#req=venues/56d45a55498e20aeceb1677e
    // https://console.developers.google.com/home/dashboard?project=pinandmeetapi
    // http://www.sitepoint.com/push-notifications-in-ionic-apps-with-google-cloud-messaging/


    .constant('constants', {
        SERVICE_URL: 'https://pinandmeetservicer2.azurewebsites.net', // <== [Input here] !!! Change also in pushHandler.js, verify.html and PinAndMeetTesting.Version1
        //SERVICE_URL: 'http://192.168.1.138:8088', // Use when running on development PC, fix IP first !!! Change also in pushHandler.js, verify.html and PinAndMeetTesting.Version1
        FB_APP_ID: '[Input here]',
        FOURSQUARE_CLIENT_ID: '[Input here]',
        FOURSQUARE_SECRET:'[Input here]', 
        POP_MESSAGE_TIMEOUT: 2500, // 2,5s
        REST_CALL_TIMEOUT: 15000, // 15s
        MAX_CHECK_IN_VENUE_DISTANCE: 300,  // m. Limit under which must the venue be to be che
        MAX_CHECK_IN_VENUE_DISTANCE_WARNING: 100, // m. Give warning
        MAX_CHECK_IN_TIME: 120, // mins
        MAX_RESUME_TIME: 120, // mins. If exceeded run launch
        //VENUE_DISTANCE_CHECK_INTERVAL: 6000, // Get pois 60s
        POI_REFRESH_INTERVAL: 60000, // Get pois 60s
        POSITION_REFRESH_INTERVAL: 5000, // Map page geoloc watch refresh time 5s
        POSITION_REFRESH_DISTANCE: 50, // How many meters from previous event must be changed to update position marker (circle)
        IDLE_POSITION_DISTANCE: 200, // How many meters from previous idle event must be changed to update POIS
        LOG_BATCH_FLUSH_INTERVAL: 20000 // Send log entries if batch selected
    })

// Start-up sequence    

function appRun($ionicPlatform) {

    $ionicPlatform.ready(function () {
        //if (window.cordova && window.cordova.plugins.Keyboard) cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        //if (window.StatusBar) {
        //    StatusBar.styleDefault();
        //}
    });
}


// Route configuration

function appConfig($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    var cache = true;
    $ionicConfigProvider.tabs.position('bottom');

    $stateProvider

    .state('launch', { url: "/launch", templateUrl: "templates/launch.html", controller: 'launchController', cache: cache })
    .state('signUp', { url: "/signUp", templateUrl: "templates/signUp.html", controller: 'signUpController', cache: cache })
    .state('accountCreated', { url: "/accountCreated", templateUrl: "templates/accountCreated.html", controller: 'accountCreatedController', cache: cache })
    .state('signIn', { url: "/signIn", templateUrl: "templates/signIn.html", controller: 'signInController', cache: cache })
    .state('imageUpload', { url: "/imageUpload", templateUrl: "templates/imageUpload.html", controller: 'imageUploadController', cache: cache })
    .state('confirmImage', { url: "/confirmImage", templateUrl: "templates/confirmImage.html", controller: 'confirmImageController', cache: cache })
    .state('matching', { url: "/matching", templateUrl: "templates/matching.html", controller: 'matchingController', cache: cache })
    .state('review', { url: "/review", templateUrl: "templates/review.html", controller: 'reviewController', cache: cache })
    //.state('testing', { url: "/testing", templateUrl: "templates/testing3.html", controller: 'testingController', cache: cache }) // Just change the template name here
    //.state('modifyAccount', { url: "/modifyAccount", templateUrl: "templates/modifyAccount.html", controller: 'modifyAccountController', cache: false })

    // Abstract menu
    .state('menu', { url: "/menu", abstract: true, templateUrl: "templates/menu.html", controller: 'menuController' })
    .state('menu.map', {
        url: "/map",
        cache: cache,
        views: {
            'menuContent': {
                templateUrl: "templates/map.html",
                controller: 'mapController'
            }
        }
    })
    .state('menu.mapList', {
        url: "/mapList",
        cache: cache,
        views: {
            'menuContent': {
                templateUrl: "templates/mapList.html",
                controller: 'mapListController'
            }
        }
    })
    .state('menu.mapListDetails', {
        url: "/mapListDetails",
        cache: cache,
        views: {
            'menuContent': {
                templateUrl: "templates/mapListDetails.html",
                controller: 'mapListDetailsController'
            }
        }
    })
    .state('menu.checkIn', {
        url: "/checkIn",
        cache: cache,
        views: {
            'menuContent': {
                templateUrl: "templates/checkIn.html",
                controller: 'checkInController'
            }
        }
    })

    .state('menu.whatNext', {
        url: "/whatNext",
        cache: cache,
        views: {
            'menuContent': {
                templateUrl: "templates/whatNext.html",
                controller: 'whatNextController'
            }
        }
    })

    .state('menu.modifyAccount', {
        url: "/modifyAccount",
        cache: cache,
        views: {
            'menuContent': {
                templateUrl: "templates/modifyAccount.html",
                controller: 'modifyAccountController'
            }
        }
    })

    .state('menu.myProfile', {
        url: "/myProfile",
        cache: cache,
        views: {
            'menuContent': {
                templateUrl: "templates/myProfile.html",
                controller: 'myProfileController'
            }
        }
    })

    .state('menu.imageUpload', {
        url: "/menuImageUpload",
        cache: cache,
        views: {
            'menuContent': {
                templateUrl: "templates/imageUpload.html",
                controller: 'imageUploadController'
            }
        }
    })

    $urlRouterProvider.otherwise('/launch'); // Huom. Laita: launcController.forceSignIn = true
}
