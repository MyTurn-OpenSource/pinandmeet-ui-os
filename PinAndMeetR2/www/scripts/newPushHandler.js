
var push;
var serviceUrl = 'https://pinandmeetservicer2.azurewebsites.net';
//var serviceUrl = 'http://192.168.1.138:8088';

function initializePushNotification() { // Called after id and session id are validated
    addLog('pushNotification', 'initializePushNotification', 'Start', '', 'EVENT');
    if (device.uuid == '3D0AD03B-8B46-431A-BEF5-FF01B96BA990') return; // Ripple
    //not this if (device.uuid == '7AB43385-1E32-493F-A2D0-8E5CF5A44765') return; // Nwe iPhone

    push = PushNotification.init({
        android: {
            senderID: "1065509075650"
        },
        ios: {
            alert: "true",
            badge: "true",
            sound: "true"
        },
        windows: {}
    });

    // Registration - Got token
    push.on('registration', function (data) {
        addLog('pushNotification', 'Registration', 'Start', data.registrationId, 'EVENT');
        registerPushNotification(data.registrationId);
    });

    // Push message received
    push.on('notification', function (data) {
        addLog('pushNotification', 'notification', 'On', JSON.stringify(data), 'EVENT');

        var name = "";  
        var message = "";
        if (device.platform == 'android' || device.platform == 'Android') {
            name = data.message;  // YES. This order!
            message = data.title;
        } else {
            message = data.message;  
            name = decodeURIComponent((data.additionalData.name + '').replace(/\+/g, '%20'));
        }
        //alert(name + ' ' + message);

        ////var id = decodeURIComponent((event.id + '').replace(/\+/g, '%20'));
        ////var name = decodeURIComponent((event.name + '').replace(/\+/g, '%20'));
        ////var message = decodeURIComponent((event.alert + '').replace(/\+/g, '%20'));

        //// Name, Message
        $("body").trigger("pushMessageEvent", [name, message, "0"]);

    });

    // Error
    push.on('error', function (e) {
        addLog('pushNotification', 'notification', 'On error', e.message, 'ERROR');
    });
}

function registerPushNotification(registrationId) {
    var apmsRegistrationId = "";
    var gcmRegistrationId = "";

    if (device.platform == 'android' || device.platform == 'Android') gcmRegistrationId = registrationId; else apmsRegistrationId = registrationId;

    var params = { sessionId: window.localStorage.sessionId, id: window.localStorage.id, loggingLevel: window.localStorage.loggingLevel, gcmRegistrationId: gcmRegistrationId, apmsRegistrationId: apmsRegistrationId };

    addLog('pushNotification', 'registerPushNotification', 'Start', gcmRegistrationId + ' - ' + apmsRegistrationId, 'EVENT');

    window.pushNotificationVerified = false;

    $.ajax({
        url: serviceUrl + '/registerPushNotification',
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(params),
        timeout: 15000 // 15s
    })
    .success(function (data, status, headers, config) {
        addLog('pushNotification', 'registerPushNotification', 'Push registered', '', 'EVENT');
    })
    .error(function (data, status, headers, config) {
        addLog('pushNotification', 'registerPushNotification', 'Push registration failed', JSON.stringify(data), 'ERROR');
    });
}


function checkHasConnectionTypeChanged() {
    var networkState = navigator.connection.type;
    var conn = "";
    if (networkState == Connection.ETHERNET) conn = "Ethernet";
    if (networkState == Connection.WIFI) conn = "Wifi";
    if (networkState == Connection.CELL_2G || networkState == Connection.CELL_3G || networkState == Connection.CELL_4G) conn = "G";

    // Conn type has changed
    if (conn != "" && window.connectionType != "" && conn != window.connectionType) {
        addLog('pushNotification', 'checkHasConnectionTypeChanged', 'New connection type', conn, 'EVENT');
        initializePushNotification(); // Conn type has changed, reinitialice conn type
    }
    window.connectionType = conn;
}

//function checkConnection() {
//    var networkState = navigator.connection.type;

//    var states = {};
//    states[Connection.UNKNOWN] = 'Unknown connection';
//    states[Connection.ETHERNET] = 'Ethernet connection';
//    states[Connection.WIFI] = 'WiFi connection';
//    states[Connection.CELL_2G] = 'Cell 2G connection';
//    states[Connection.CELL_3G] = 'Cell 3G connection';
//    states[Connection.CELL_4G] = 'Cell 4G connection';
//    states[Connection.CELL] = 'Cell generic connection';
//    states[Connection.NONE] = 'No network connection';

//    alert('Connection type: ' + states[networkState]);
//}

function addLog(module, method, eventName, parameters, type) {
    var ls = window.localStorage;
    var loggingLevel = ls.loggingLevel;
    if (loggingLevel == null) loggingLevel = 110;
    if (loggingLevel == 0) return;

    var logEvent = {
        id: ls.id,
        sessionId: ls.sessionId,
        loggingLevel: loggingLevel,
        module: module,
        method: method,
        eventName: eventName,
        parameters: parameters,
        localTimeStamp: getLocalTimeStamp()
    };
    //alert(JSON.stringify(logEvent));

    // (logEvent.id, logEvent.sessionId, logEvent.module, logEvent.method, logEvent.eventName, logEvent.parameters, logEvent.logEvents, "CLIENT", (int)GeneralHelpers.EventType.EVENT);

    // Send log entry, don't catch if OK or not
    var fullUrl = serviceUrl + "/addLogEvent";
    if (type == 'ERROR') serviceUrl + "/addLogError";

    $.ajax({
        url: fullUrl,
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(logEvent)
    })
    .success(function (data, status, headers, config) {
        //alert('send ' + JSON.stringify(logEvent));
    })
    .error(function (data, status, headers, config) {
        alert(JSON.stringify(data));
    });
}

function getTime() {
    var currentTime = new Date();
    var currentHours = currentTime.getHours();
    var currentMinutes = currentTime.getMinutes();
    var currentSeconds = currentTime.getSeconds();
    var currentMilliSeconds = currentTime.getMilliseconds();

    // Pad the minutes and seconds with leading zeros, if required
    currentHours = (currentHours < 10 ? "0" : "") + currentHours;
    currentMinutes = (currentMinutes < 10 ? "0" : "") + currentMinutes;
    currentSeconds = (currentSeconds < 10 ? "0" : "") + currentSeconds;
    currentMilliSeconds = (currentMilliSeconds + "00").substr(0, 2);
    return currentHours + ":" + currentMinutes + ":" + currentSeconds + "." + currentMilliSeconds;
}

function getDate() {
    var currentTime = new Date();
    var currentDay = currentTime.getDate();
    var currentMonth = currentTime.getMonth() + 1;
    var currentYear = currentTime.getFullYear();

    // Pad the minutes and seconds with leading zeros, if required
    currentDay = (currentDay < 10 ? "0" : "") + currentDay;
    currentMonth = (currentMonth < 10 ? "0" : "") + currentMonth;
    return currentYear + "-" + currentMonth + "-" + currentDay;
}

// ----------------------------------------------------------------------------------
// Get timestamp in format yyyy-MM-dd hh:mm:ss.ms
// ----------------------------------------------------------------------------------
function getLocalTimeStamp() {
    return getDate() + ' ' + getTime();
}


