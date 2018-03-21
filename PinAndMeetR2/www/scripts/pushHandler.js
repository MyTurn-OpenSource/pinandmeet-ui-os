
//var pushNotification;
//var serviceUrl = 'https://pinandmeetservicer2.azurewebsites.net';
////var serviceUrl = 'http://192.168.1.138:8088';

//function initializePushNotification() { // Called after id and session id are validated
//    addLog('pushNotification', 'initializePushNotification', 'Start', '', 'EVENT');
//    if (device.uuid == '3D0AD03B-8B46-431A-BEF5-FF01B96BA990') return; // Ripple
//    //not this if (device.uuid == '7AB43385-1E32-493F-A2D0-8E5CF5A44765') return; // Nwe iPhone
    
//    pushNotification = window.plugins.pushNotification;
//    if (device.platform == 'android' || device.platform == 'Android') {
//        addLog('pushNotification', 'initializePushNotification', 'Registering GCM', '', 'EVENT');
//        pushNotification.register(
//        gcmSuccessHandler,
//        gcmAndApnsErrorHandler,
//        {
//            "senderID": "1065509075650", //"1056061357883",
//            "ecb": "window.onAndroidNotification"
//        });
//    } else {
//        addLog('pushNotification', 'initializePushNotification', 'Registering APNS', '', 'EVENT');
//        pushNotification.register(
//        tokenHandler,
//        gcmAndApnsErrorHandler,
//        {
//            "badge": "true",
//            "sound": "true",
//            "alert": "true",
//            "ecb": "window.onNotificationAPN"
//        });
//    }
//}
//function gcmSuccessHandler(result) {
//    addLog('pushNotification', 'gcmSuccessHandler', 'Registration OK', result, 'EVENT');
//}

//function gcmAndApnsErrorHandler(error) {
//    addLog('pushNotification', 'gcmAndApnsErrorHandler', 'Registration ERROR', error, 'ERROR');
//}



//// IOS
//function tokenHandler(result) {
//    addLog('pushNotification', 'tokenHandler', 'IOS device token received', result, 'EVENT');
//    registerPushNotification('', result);
//}

//// iOS
//window.onNotificationAPN = function (event) {
//    addLog('pushNotification', 'onNotificationAPN', 'Start', JSON.stringify(event), 'EVENT');
//    var id = decodeURIComponent((event.id + '').replace(/\+/g, '%20'));
//    var name = decodeURIComponent((event.name + '').replace(/\+/g, '%20'));
//    var message = decodeURIComponent((event.alert + '').replace(/\+/g, '%20'));

//    // Name, Message
//    $("body").trigger("pushMessageEvent", [name, message, id]);


//    //if (event.alert) {
//    //    navigator.notification.alert(event.alert);
//    //}

//    //if (event.sound) {
//    //    var snd = new Media(event.sound);
//    //    snd.play();
//    //}

//    //if (event.badge) {
//    //    pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
//    //}
//}



//// Android
//window.onAndroidNotification = function (e) {
//    addLog('pushNotification', 'onAndroidNotification', 'Start', e.event, 'EVENT');

//    switch (e.event) {
//        case 'registered':
//            if (e.regid.length > 0) {
//                addLog('pushNotification', 'onAndroidNotification', 'Registered', e.regid, 'EVENT');
//                // Your GCM push server needs to know the regID before it can push to this device
//                // here is where you might want to send it the regID for later use.
//                registerPushNotification(e.regid, '');

//                //sendRegID(e.regid);
//            }
//            break;

//        case 'message':
//            // if this flag is set, this notification happened while we were in the foreground.
//            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
//            if (e.foreground) {
//                addLog('pushNotification', 'onAndroidNotification', 'Foreground inline nofification', '', 'EVENT');

//                // on Android soundname is outside the payload.
//                // On Amazon FireOS all custom attributes are contained within payload
//                // Kokeile myöhemmin: var soundfile = e.soundname || e.payload.sound;
//                // if the notification contains a soundname, play it.
//                // playing a sound also requires the org.apache.cordova.media plugin
//                // Kokeile myöhemmin: var my_media = new Media("/android_asset/www/"+ soundfile);

//                // Kokeile myöhemmin: my_media.play();
//            }
//            else {	// otherwise we were launched because the user touched a notification in the notification tray.
//                if (e.coldstart)
//                    addLog('pushNotification', 'onAndroidNotification', 'Coldstart nofification', '', 'EVENT');
//                else
//                    addLog('pushNotification', 'onAndroidNotification', 'Background nofification', '', 'EVENT');
//            }

//            addLog('pushNotification', 'onAndroidNotification', 'Payload', JSON.stringify(e.payload), 'EVENT');

//            $("body").trigger("pushMessageEvent", [e.payload.message, e.payload.title, 0]);
//            break;

//        case 'error':
//            addLog('pushNotification', 'onAndroidNotification', e.msg, '', 'ERROR');
//            break;

//        default:
//            addLog('pushNotification', 'onAndroidNotification', 'Unknown event', '', 'ERROR');
//            break;
//    }
//}




//function registerPushNotification(gcmRegistrationId, apmsRegistrationId) {
//    var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel, gcmRegistrationId: gcmRegistrationId, apmsRegistrationId: apmsRegistrationId };

//    addLog('pushNotification', 'registerPushNotification', 'Start', gcmRegistrationId + ' - ' + apmsRegistrationId, 'EVENT');

//    window.pushNotificationVerified = false;
//    // Note: UserHelpers.RegisterPushNotification(dynamic userData) will automatically send push verification message

//    $.ajax({
//        url: serviceUrl + '/registerPushNotification',
//        type: "POST",
//        dataType: "json",
//        contentType: "application/json",
//        data: JSON.stringify(params),
//        timeout: 15000 // 15s
//    })
//    .success(function (data, status, headers, config) {
//        addLog('pushNotification', 'registerPushNotification', 'Push registered', '', 'EVENT');
//    })
//    .error(function (data, status, headers, config) {
//        addLog('pushNotification', 'registerPushNotification', 'Push registration failed', JSON.stringify(data), 'ERROR');
//    });
//}


//function checkHasConnectionTypeChanged() {
//    var networkState = navigator.connection.type;
//    var conn = "";
//    if (networkState == Connection.ETHERNET) conn = "Ethernet";
//    if (networkState == Connection.WIFI) conn = "Wifi";
//    if (networkState == Connection.CELL_2G || networkState == Connection.CELL_3G || networkState == Connection.CELL_4G) conn = "G";

//    // Conn type has changed
//    if (conn != "" && window.connectionType != "" && conn != window.connectionType) {
//        addLog('pushNotification', 'checkHasConnectionTypeChanged', 'New connection type', conn, 'EVENT');
//        initializePushNotification(); // Conn type has changed, reinitialice conn type
//    }
//    window.connectionType = conn;
//}

////function checkConnection() {
////    var networkState = navigator.connection.type;

////    var states = {};
////    states[Connection.UNKNOWN] = 'Unknown connection';
////    states[Connection.ETHERNET] = 'Ethernet connection';
////    states[Connection.WIFI] = 'WiFi connection';
////    states[Connection.CELL_2G] = 'Cell 2G connection';
////    states[Connection.CELL_3G] = 'Cell 3G connection';
////    states[Connection.CELL_4G] = 'Cell 4G connection';
////    states[Connection.CELL] = 'Cell generic connection';
////    states[Connection.NONE] = 'No network connection';

////    alert('Connection type: ' + states[networkState]);
////}

//function addLog(module, method, eventName, parameters, type) {
//    var ls = window.localStorage;
//    var loggingLevel = ls.loggingLevel;
//    if (loggingLevel == null) loggingLevel = 110;
//    if (loggingLevel == 0) return;

//    var logEvent = {
//        id: ls.id,
//        sessionId: ls.sessionId,
//        loggingLevel: loggingLevel,
//        module: module,
//        method: method,
//        eventName: eventName,
//        parameters: parameters,
//        localTimeStamp: getLocalTimeStamp()
//    };
//    //alert(JSON.stringify(logEvent));

//    // (logEvent.id, logEvent.sessionId, logEvent.module, logEvent.method, logEvent.eventName, logEvent.parameters, logEvent.logEvents, "CLIENT", (int)GeneralHelpers.EventType.EVENT);

//    // Send log entry, don't catch if OK or not
//    var fullUrl = serviceUrl + "/addLogEvent";
//    if (type == 'ERROR') serviceUrl + "/addLogError";

//    $.ajax({
//        url: fullUrl,
//        type: "POST",
//        dataType: "json",
//        contentType: "application/json",
//        data: JSON.stringify(logEvent)
//    })
//    .success(function (data, status, headers, config) {
//    })
//    .error(function (data, status, headers, config) {
//    });
//}

//function getTime() {
//    var currentTime = new Date();
//    var currentHours = currentTime.getHours();
//    var currentMinutes = currentTime.getMinutes();
//    var currentSeconds = currentTime.getSeconds();
//    var currentMilliSeconds = currentTime.getMilliseconds();

//    // Pad the minutes and seconds with leading zeros, if required
//    currentHours = (currentHours < 10 ? "0" : "") + currentHours;
//    currentMinutes = (currentMinutes < 10 ? "0" : "") + currentMinutes;
//    currentSeconds = (currentSeconds < 10 ? "0" : "") + currentSeconds;
//    currentMilliSeconds = (currentMilliSeconds + "00").substr(0, 2);
//    return currentHours + ":" + currentMinutes + ":" + currentSeconds + "." + currentMilliSeconds;
//}

//function getDate() {
//    var currentTime = new Date();
//    var currentDay = currentTime.getDate();
//    var currentMonth = currentTime.getMonth() + 1;
//    var currentYear = currentTime.getFullYear();

//    // Pad the minutes and seconds with leading zeros, if required
//    currentDay = (currentDay < 10 ? "0" : "") + currentDay;
//    currentMonth = (currentMonth < 10 ? "0" : "") + currentMonth;
//    return currentYear + "-" + currentMonth + "-" + currentDay;
//}

//// ----------------------------------------------------------------------------------
//// Get timestamp in format yyyy-MM-dd hh:mm:ss.ms
//// ----------------------------------------------------------------------------------
//function getLocalTimeStamp() {
//    return getDate() + ' ' + getTime();
//}


