'use strict';

angular
  .module("ngHtml5Dnd")
  .directive("ngDragDrop", ngDragDrop);

function ngDragDrop() {

  // returns elem isolated scope
  return {
    restrict: 'E',
    replace: true,
    scope: {},
    link: link,
    templateUrl: templateUrl
  };

  function templateUrl(elem, attrs) {
    // do something here...
  }

  function link(scope, element, attrs) {
    // do something here...
  }
}