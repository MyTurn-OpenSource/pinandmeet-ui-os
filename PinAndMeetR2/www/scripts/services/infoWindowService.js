angular
    .module('app')
    .service('infoWindowService', infoWindowService);

// ------------------------------------------------------------------------------
// Info window related services
// ------------------------------------------------------------------------------

function infoWindowService($http, $q, $timeout, generalServices, $ionicPopover, constants) {

    //this.openInfoWindow = openInfoWindow;

    //// Based on window.state
    //function openInfoWindow($event) {
    //    alert(window.state);
    //    //$scope.popover.show($event);
    //}


    //$ionicPopover.fromTemplateUrl('infoCheckIn.html', {
    //    scope: $scope
    //}).then(function (popover) {
    //    $scope.popover = popover;
    //});

    //$scope.openPopover = function ($event) {
    //    $scope.popover.show($event);
    //};
    //$scope.closePopover = function () {
    //    $scope.popover.hide();
    //};
    ////Cleanup the popover when we're done with it!
    //$scope.$on('$destroy', function () {
    //    $scope.popover.remove();
    //});
    //// Execute action on hide popover
    //$scope.$on('popover.hidden', function () {
    //    // Execute action
    //});
    //// Execute action on remove popover
    //$scope.$on('popover.removed', function () {
    //    // Execute action
    //});

}