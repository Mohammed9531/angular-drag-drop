'use strict';

angular
  .module('angular-html-drag-drop')
  .directive('ngHtmlDragDrop', ngHtmlDragDrop);

ngHtmlDragDrop.$inject = [
    "$parse"
  , "$timeout"
  , "$log"
  , "$window"
  , "DragDropService"
  , "$rootScope"
];

function ngHtmlDragDrop($parse, $timeout, $log,
  $window, DragDropService, $rootScope) {

  return {
    restrict: 'A',
    require: '?ngModel',
    scope: {
      ngHtmlDragDrop: '='
    },
    link: link
  };

  function link(scope, element, attrs, ngModel) {
    var DragDropServiceInstance = DragDropServiceInstance || DragDropService.getInstance();

    DragDropServiceInstance.setColumns(element);
    DragDropServiceInstance.options.inUse = false;
    DragDropServiceInstance.options.isHandle = false;

    DragDropServiceInstance.options.properties = {
      scope: scope,
      attrs: attrs,
      elem: element,
      models: ngModel
    };

    $rootScope.$on("draggableEnd",
      function($event, data) {
        scope.$apply();
        DragDropServiceInstance.update();
      }
    );

    if (ngModel) {
      ngModel.$render = DragDropServiceInstance
        .onModelRender.bind(this, scope, element, attrs, ngModel);
    } else {
      $log.info('Missing ng-model in template');
    }

    scope.$watch("ngHtmlDragDrop", onDataChange, true);

    function onDataChange(value) {
      var dd = DragDropServiceInstance;

      if (value && Object.keys(value).length > 0) {
        DragDropServiceInstance.options = angular.extend(dd.options,
          angular.copy(value)
        );
      }

      if (value == "destroy") {
        if (dd.options.isHandle) {
          DragDropServiceInstance.options.isHandle = false;
          DragDropServiceInstance.unregister();
        }
        return;
      }

      DragDropServiceInstance.options = dd.options || {};

      if (angular.isDefined(scope.ngHtmlDragDrop.construct)) {
        scope.ngHtmlDragDrop.construct(ngModel.$modelValue);
      }

      element[0].classList.add('widgets-sortable');
      DragDropServiceInstance.update();
      $timeout(function() {
        DragDropServiceInstance.first_load = true;
      });
    }
  }
}