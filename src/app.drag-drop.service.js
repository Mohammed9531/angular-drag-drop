'use strict';

  angular
    .module('angular-html-drag-drop')
    .service('DragDropService', DragDropService);

  DragDropService.$inject = ['$timeout'];

  function DragDropService($timeout) {
    var self = this,
      current = {};

    this.cols = [];

    this.setColumns = function(el) {
      if (!el && !!!el[0]) return;

      self.cols = el[0].children;
    }

    this.handleDragOver = function(e) {
      if (e.preventDefault) {
        e.preventDefault(); // Allows us to drop.
      }
      e.dataTransfer.dropEffect = 'move';
      current = e.currentTarget;

      if (!current.classList.contains('over')) {
        current.classList.add('over');
      }
    };
    this.handleDragLeave = function(e) {
      e.currentTarget.classList.remove('over');
    };

    this.handleDragEnter = function(e) {
      current = e.currentTarget;

      if (!current.classList.contains('over')) {
        current.classList.add('over');
      }
    };

    this.handleDragEnd = function(e) {
      // this/e.target is the source node.
      [].forEach.call(self.cols, function(col) {
        col.classList.remove('over');
        col.classList.remove('moving');
      });
    };

    this.onModelRender = function(scope, element, attrs, ngModel, sortable) {
      $timeout(function() {

        console.log(attrs);

        //init flag indicate the first load sortable is done or not
        sortable.first_load = false;

        scope.$watch('ngExtraSortable', function(value) {
          element.extra_data = value;
        });

        scope.$watch('widgetsSortable', function(value) {

          sortable.options = angular.copy(value);

          if (value == "destroy") {
            if (dataModel._options.isHandle) {
              sortable.unbind();
              dataModel._options.isHandle = false;
            }
            return;
          }

          sortable.options = sortable.options || {};
          sortable.options.allow_cross = sortable.options.allow_cross || false

          if (angular.isDefined(sortable.options.construct)) {
            sortable.options.construct(ngModel.$modelValue);
          }

          element[0].classList.add('widgets-sortable');
          sortable.update();
          $timeout(function() {
            sortable.first_load = true;
          })
        }, true);

        //Watch ngModel and narrate it
        scope.$watch('ngModel', function(value) {
          if (!sortable.first_load || sortable.options == 'destroy') {
            //Ignore on first load
            return;
          }

          $timeout(function() {
            sortable.update();
          });
        }, true);
      });
    };


    this.handleDrop = function(ngModel, dataModel, scope, sortable, e) {

      var _ce = e.currentTarget;

      // this/e.target is current target element.
      if (e.stopPropagation) {
        // stops the browser from redirecting.
        e.stopPropagation();
      }
      e.preventDefault();
      _ce.classList.remove('over');

      // Don't do anything if we're dropping on the same column we're dragging.
      if (dataModel._sourceItem != this) {

        if (dataModel._sourceItem === null) {
          $log.info("Invalid sortable");
          return;
        }

        var source_model = dataModel._sourceItem.model;
        var drop_index = _ce.index;

        if (ngModel.$modelValue.indexOf(source_model) != -1) {

          var drag_index = dataModel._sourceItem.index;
          var temp = angular.copy(ngModel.$modelValue[drag_index]);

          sortable.unbind();

          ngModel.$modelValue.splice(drag_index, 1);
          ngModel.$modelValue.splice(drop_index, 0, temp);

        } else if (sortable.options.allow_cross) {
          ngModel.$modelValue.splice(drop_index, 0, source_model);
        } else {
          $log.info("disabled cross dropping");
          return;
        }

        //return;
        scope.$apply();
        sortable.update();

        if (sortable.options && angular.isDefined(sortable.options.stop)) {
          $log.info('Make callback');
          /*sortable.options.stop(ngModel.$modelValue, drop_index,
            element.extra_data, $window['drag_source_extra']);*/
        }
      }
      return false;
    };
  }