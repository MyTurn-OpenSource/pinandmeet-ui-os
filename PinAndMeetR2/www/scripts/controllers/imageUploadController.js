angular
    .module('app')
    .controller('imageUploadController', imageUploadController);

function imageUploadController($scope, $http, $state, $q, generalServices, userServices, stateServices, constants, $ionicPopup, $ionicHistory, $timeout) {

    $scope.takePicture = takePicture;
    $scope.fromGallery = fromGallery;

    var waitPopup;
    var ftHandle;
    var ftCancelled;

    function takePicture() {
        generalServices.addLogEvent('imageUploadController', 'takePicture', 'Start', '');

        var pictureSource = navigator.camera.PictureSourceType;
        var destinationType = navigator.camera.DestinationType;

        navigator.camera.getPicture(onCapturePhoto, onCaptureFail, {
            quality: 100,
            sourceType: Camera.PictureSourceType.CAMERA,
            destinationType: destinationType.FILE_URI
        });
    }

    function fromGallery() {
        generalServices.addLogEvent('imageUploadController', 'fromGallery', 'Start', '');
        var pictureSource = navigator.camera.PictureSourceType;
        var destinationType = navigator.camera.DestinationType;

        navigator.camera.getPicture(onCapturePhoto, onCaptureFail, {
            quality: 100,
            sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
            destinationType: destinationType.FILE_URI
        });
    }

    function onCaptureFail(message) {
        generalServices.addLogError('imageUploadController', 'onCaptureFail', message, '');
        generalServices.popMessageOk('Image capture failed.')
    }

    var retries = 0;
    function onCapturePhoto(fileURI) {
        generalServices.addLogEvent('imageUploadController', 'onCapturePhoto', 'Start', fileURI);
        // Upload succeeded
        var win = function (r) {
            waitPopup.close();
            clearCache();
            retries = 0;
            var fileName = r.response.replace('"', '').replace('"', '');
            generalServices.addLogEvent('imageUploadController', 'onCapturePhoto', 'File uploaded', fileName);

            //$('#profilePicture').attr('src', fileName);
            window.possibleImageUrl = fileName;
            //window.localStorage.setItem("imageUrl", fileName);

            //if (window.changeProfileImage)
            //    stateServices.setState('MENU.CONFIRM_IMAGE');
            //else
            stateServices.setState('CONFIRM_IMAGE');

            // Need to wait that is back from uploading page
            //$ionicHistory.goBack(); 
            //$timeout(function () {
            //    stateServices.setState('CONFIRM_IMAGE');
            //}, 200); 
        }

        var fail = function (error) {
            waitPopup.close();
            clearCache();
            if (ftCancelled) {
                generalServices.addLogError('imageUploadController', 'onCapturePhoto', 'File upload cancelled by user', '');
            } else {
                generalServices.addLogEvaddLogError('imageUploadController', 'onCapturePhoto', 'File upload error', JSON.stringify(error));
                generalServices.popMessageOk('Image capture failed.')
            }
        }

        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        options.params = {}; // if we need to send parameters to the server request
        var ft = new FileTransfer();
        ftCancelled = false;
        ft.upload(fileURI, encodeURI(constants.SERVICE_URL + "/uploadImage"), win, fail, options);
        ftHandle = ft;

        openUploadingPageAlert();

        //$state.go("uploadingImage");
    }

    function openUploadingPageAlert() {
        generalServices.addLogEvent('imageUploadController', 'openUploadingPageAlert', 'Start');
        $scope.data = {}

        // An elaborate, custom popup
        waitPopup = $ionicPopup.show({
            template: '<center><ion-spinner></ion-spinner></center>',
            title: 'Uploading profile picture',
            subTitle: 'Please wait',
            scope: $scope,
            buttons: [
                { text: 'Cancel', type: 'button-positive' }
            ]
        });
        waitPopup.then(function (res) {
            ftCancelled = true;
            ftHandle.abort();
        });
    }

    function clearCache() {
        navigator.camera.cleanup();
    }
}