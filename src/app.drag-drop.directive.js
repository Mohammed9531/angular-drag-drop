'use strict';

angular
  .module("ngHtml5Dnd")
  .directive("ngDragDrop", ngDragDrop);

function ngDragDrop() {

  // returns elem isolated scope
  return {
    restrict: 'A',
    require: '?ngModel',
    scope: {
        widgetsSortable: '=',
        ngModel: '=',
        ngExtraSortable: '='
    },
    link: link
  };

  function link(scope, element, attrs, ctrl) {
    
  }
}