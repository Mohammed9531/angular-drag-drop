/**
 * @author : Shoukath Mohammed
 */
(function() {

  'use strict';

  angular
    .module('myApp')
    .controller('DemoCtrl', DemoCtrl);

  DemoCtrl.$inject = ['$scope'];

  function DemoCtrl($scope) {

    var vm = this;

    $scope.blocks = [
    {
    	title: "Angular1",
    	desc: "Sample Angular1"
    },
    {
    	title: "Angular2",
    	desc: "Sample Angular2"
    },
    {
    	title: "Angular3",
    	desc: "Sample Angular3"
    },
    {
    	title: "Angular4",
    	desc: "Sample Angular4"
    }
    ];

    $scope.blocks1 = [
    {
      title: "Ng1",
      desc: "Sample Ng1"
    },
    {
      title: "Ng2",
      desc: "Sample Ng2"
    },
    {
      title: "Ng3",
      desc: "Sample Ng3"
    },
    {
      title: "Ng4",
      desc: "Sample Ng4"
    }
    ];

        // drag and drop customization options
    $scope.options = {
      //only allow draggable when click on handle element
      handle: '.handle',

      //construct method before sortable code
      construct: fnOnDragStart,

      //callback after item is dropped
      stop: fnOnDragEnd,
      replace: true
    };

    $scope.options1 = {
      //only allow draggable when click on handle element
      handle: '.handle1',

      //construct method before sortable code
      construct: fnOnDragStart,

      //callback after item is dropped
      stop: fnOnDragEnd,
      replace: true
    }


    /*******************************************************
     ******************* Helper Methods ********************
    /*******************************************************/

    /**
     * @ngdoc function
     * @name: fnInterceptChecker
     * @methodOf: DashboardController
     * @type: private
     */
    function fnOnDragStart(models) {
      fnHelper(models);
    }

    /**
     * @ngdoc function
     * @name: fnOnDragEnd
     * @methodOf: DashboardController
     * @type: private
     */
    function fnOnDragEnd(models, droppedIndex) {
      var __models = fnHelper(models);
      console.log("OnEnd: ", __models);

      // service call goes here....
    }

    /**
     * @ngdoc function
     * @name: fnHelper
     * @methodOf: DashboardController
     * @type: private
     */
    function fnHelper(models) {
      _.each(models, function(model, idx) {
        models[idx].position = idx + 1;
      });
      return models;
    }

  }
})();