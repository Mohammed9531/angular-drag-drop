'use strict';

angular
  .module('angular-html-drag-drop')
  .directive('ngHtmlDragDrop', ngHtmlDragDrop);

ngHtmlDragDrop.$inject = [
  "$parse", "$timeout", "$log", "$window", "DragDropService", "$rootScope"
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
    var dd = dd || DragDropService.getInstance();

    dd.setColumns(element);
    dd.options.inUse = false;
    dd.options.isHandle = false;

    dd.options.properties = {
      scope: scope,
      attrs: attrs,
      elem: element,
      models: ngModel
    };

    $rootScope.$on("draggableEnd",
      function($event, data) {
        scope.$apply();
        dd.update();
      }
    );

    if (ngModel) {
      ngModel.$render = dd
        .onModelRender.bind(this, scope, element, attrs, ngModel);
    } else {
      $log.info('Missing ng-model in template');
    }

    scope.$watch("ngHtmlDragDrop", onDataChange, true);


    function onDataChange(value) {
      if (value && Object.keys(value).length > 0) {
        dd.options = angular.extend(dd.options,
          angular.copy(value)
        );
      }

      if (value == "destroy") {
        if (dd.options.isHandle) {
          dd.options.isHandle = false;
          dd.unregister();
        }
        return;
      }

      dd.options = dd.options || {};

      if (angular.isDefined(scope.ngHtmlDragDrop.construct)) {
        scope.ngHtmlDragDrop.construct(ngModel.$modelValue);
      }

      element[0].classList.add('widgets-sortable');
      dd.update();
      $timeout(function() {
        dd.first_load = true;
      });
    }
  }
}