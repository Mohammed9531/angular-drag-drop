'use strict';

/**
 * @ngdoc service
 * @name DragDropService
 *
 * @requires $timeout
 *
 * @module angular-html-drag-drop
 *
 * @description
 * Directive that constructs the tree grid
 */
angular
  .module('angular-html-drag-drop')
  .service('DragDropService', DragDropService);

DragDropService.$inject = ['$timeout', '$log', '$window', '$document', '$rootScope'];

function DragDropService($timeout, $log, $window, $document, $rootScope) {

  // {jshint} complains about possible strict violation
  // adding this line below skips the validation 
  /*jshint validthis: true */

  // adding this line below skips dot notation validation
  /*jshint sub:true*/
  var count = 0;
  var DataFactory = function() {
    var self = this;

    // holds list of elements to be dragged
    this.cols = [];

    this.options = {
      'sortBy': null,
      'inUse': false,
      'storage': null,
      'active': false,
      'replace': false,
      'properties': {},
      'isHandle': false,
      'firstLoad': false,
      'hasDragHandle': false
    };

    this.destItem = {};
    this.sourceItem = {};
    this.destIndex = null;
    this.sourceIndex = null;


    function onDataChange(el, ngModel, scope, value) {
      if (value && Object.keys(value).length > 0) {
        self.options = angular.extend(self.options,
          angular.copy(value)
        );
      }

      if (value == "destroy") {
        if (self.options.isHandle) {
          self.options.isHandle = false;
          self.unbind();
        }
        return;
      }

      self.options = self.options || {};

      if (angular.isDefined(scope.construct)) {
        scope.construct(ngModel.$modelValue);
      }

      el[0].classList.add('widgets-sortable');
      self.update();
      $timeout(function() {
        self.first_load = true;
      });
    }

    function onModelChange(value) {
      if (!self.first_load ||
        self.options == 'destroy') {
        return;
      }

      $timeout(function() {
        self.update();
      });
    }

    function toTitleCase(str) {
      return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }

    function getSuffix(str) {
      var _str = toTitleCase(str),
        suffix = _str.substring(_str.indexOf("g") + 1);
      return _str.replace(suffix, toTitleCase(suffix));
    }

    /**
     * @name: setColumns
     * @methodOf: DragDropService
     *
     * @param {el} parent element
     *
     * @description
     * sets list of elements to make them draggable
     */
    this.setColumns = function(el) {
      if (!el && !!!el[0]) return;

      self.cols = el[0].children;
    }

    /**
     * @name: handleDragOver
     * @methodOf: DragDropService
     *
     * @param {e} triggered event
     *
     * @description
     * executed on element drag over.
     */
    this.handleDragOver = function(e) {
      var current = e.currentTarget;

      if (e.preventDefault) {
        e.preventDefault(); // Allows us to drop.
      }
      e.dataTransfer.dropEffect = 'move';

      if (!current.classList.contains('over')) {
        current.classList.add('over');
      }
    };

    /**
     * @name: handleDragLeave
     * @methodOf: DragDropService
     *
     * @param {e} triggered event
     *
     * @description
     * executed on element drag leave.
     */
    this.handleDragLeave = function(e) {
      e.currentTarget.classList.remove('over');
    };

    /**
     * @name: handleDragEnter
     * @methodOf: DragDropService
     *
     * @param {e} triggered event
     *
     * @description
     * executed on element drag enter.
     */
    this.handleDragEnter = function(e) {
      var current = e.currentTarget;

      if (!current.classList.contains('over')) {
        current.classList.add('over');
      }
    };

    /**
     * @name: handleDragEnd
     * @methodOf: DragDropService
     *
     * @param {e} triggered event
     *
     * @description
     * executed on element drag end.
     */
    this.handleDragEnd = function(e) {
      [].forEach.call(self.cols, function(col) {
        col.classList.remove('over');
        col.classList.remove('moving');
      });
    };

    /**
     * @name: onModelRender
     * @methodOf: DragDropService
     *
     * @param {e} triggered event
     *
     * @description
     * executed on element drag end.
     */
    this.onModelRender = function(scope, el, attrs, ngModel) {
      $timeout(onDataRendered, true);

      //Watch ngModel and narrate it
      scope.$watch('ngModel', onModelChange, true);


      function onDataRendered() {
        //init flag indicate the first load sortable is done or not
        self.first_load = false;

        //scope.$watch('ngHtmlDragDrop', onDataChange.bind(this, el, ngModel), true);
      }
    };

    /**
     * @name: onDataChange
     * @methodOf: DataService
     *
     * @param {newArr} updated data
     * @param {oldArr} old data
     *
     * @description
     * $watch callback method
     */
    this.handleDrop = function(e) {
      self.destItem = e.currentTarget;

      // this/e.target is current target element.
      if (e.stopPropagation) {
        // stops the browser from redirecting.
        e.stopPropagation();
      }
      e.preventDefault();
      self.destItem.classList.remove('over');

      // don't do anything if we're dropping on the same column we're dragging.
      if (self.sourceItem != self.destItem) {
        if (self.sourceItem === null) {
          $log.info("Invalid sortable");
          return;
        }
        self.updateModel();
      }
      return false;
    };


    /**
     * @name: onDataChange
     * @methodOf: DataService
     *
     * @param {newArr} updated data
     * @param {oldArr} old data
     *
     * @description
     * $watch callback method
     */
    this.updateModel = function() {
      var dragIndex = self.sourceItem.index;
      var dragModel = self.sourceItem.model;

      var dropIndex = self.destItem.index;
      var dropModel = self.destItem.model;
      var _model = self.options.properties.models || {};
      var dragged = angular.copy(_model.$modelValue[dragIndex]);

      if (_model.$modelValue.indexOf(dragModel) != -1) {
        self.unbind();
        if (self.options.replace) {
          _model.$modelValue[dragIndex] = dropModel;
          _model.$modelValue[dropIndex] = dragModel;
        } else {
          _model.$modelValue.splice(dragIndex, 1);
          _model.$modelValue.splice(dropIndex, 0, dragged);
        }
      } else {
        $log.info("Invalid action");
        return;
      }

      self.onEnd = $rootScope.$emit("draggableEnd", {
        model: _model,
        dropIndex: dropIndex,
        dragModel: dragModel,
        dropModel: _model.$viewValue[dropIndex],
        dragIndex: dragIndex
      });
    };

    /**
     * @name: onDataChange
     * @methodOf: DataService
     *
     * @param {newArr} updated data
     * @param {oldArr} old data
     *
     * @description
     * $watch callback method
     */
    this.update = function() {
      $log.info("Update sortable:");
      self.sourceItem = null;

      var index = 0;
      var _model = self.options.properties.models || {};

      //This's empty list, so just need listen drop from other
      if (_model.$modelValue.length === 0) {
        if (self.cols.length > 0) {
          //Set index = 0( simulate first index )
          self.cols[0].index = 0;
          self.register(self.cols[0]);
        }
        return;
      }

      self.cols = self.cols || [];
      [].forEach.call(self.cols, function(col) {
        if (self.options && self.options.handle) {
          var handles = $document[0].querySelectorAll(self.options.handle);

          if (handles && handles.length) {
            [].forEach.call(handles, function(handle) {
              var el = angular.element(handle);
              el.unbind('mousedown', self.activehandle);
              el.bind('mousedown', self.activehandle);
            });
          }
        }

        // set index on each element to consume it 
        // in re-arraging the elements based on the src & dest indexes
        col.index = index;
        col.model = _model.$modelValue[index];
        index++;

        // make columns draggable
        col.setAttribute('draggable', 'true');

        // register to drag & drop events
        self.register(col);
      });
      self.options.isHandle = true;
    };

    /**
     * @name: onDataChange
     * @methodOf: DataService
     *
     * @param {newArr} updated data
     * @param {oldArr} old data
     *
     * @description
     * $watch callback method
     */
    this.activehandle = function() {
      self.options.isHandle = true;
    };

    /**
     * @name: onDataChange
     * @methodOf: DataService
     *
     * @param {newArr} updated data
     * @param {oldArr} old data
     *
     * @description
     * $watch callback method
     */
    this.handleDragStart = function(e) {
      var _ce = e.currentTarget;

      self.sourceItem = null;
      if (self.options && !self.options.isHandle && self.options.handle) {
        e.preventDefault();
        return;
      }

      self.options.isHandle = false;
      e.dataTransfer.effectAllowed = 'move';

      //Fixed on firefox and IE 11
      if (self.currentBrowser != "IE") {
        e.dataTransfer.setData('text/plain', 'anything');
      }
      self.sourceItem = _ce;

      // this/e.target is the source node.
      _ce.classList.add('moving');
    };

    /**
     * @name: onDataChange
     * @methodOf: DataService
     *
     * @param {newArr} updated data
     * @param {oldArr} old data
     *
     * @description
     * $watch callback method
     */
    this.register = function(el) {
      self.eventsProcessor(el, 'addEventListener');
    };

    /**
     * @name: onDataChange
     * @methodOf: DataService
     *
     * @param {newArr} updated data
     * @param {oldArr} old data
     *
     * @description
     * $watch callback method
     */
    this.unbind = function() {
      self.options.isHandle = false;

      [].forEach.call(self.cols, function(col) {
        col.removeAttribute('draggable');
        self.eventsProcessor(col, 'removeEventListener');
      });
    };

    /**
     * @name: onDataChange
     * @methodOf: DataService
     *
     * @param {newArr} updated data
     * @param {oldArr} old data
     *
     * @description
     * $watch callback method
     */
    this.eventsProcessor = function(el, action) {
      for (var i = 0; i < self.events.length; i++) {
        el[action](self.events[i], self["handle" + getSuffix(self.events[i])], false);
      }
    };
  }

  DataFactory.prototype.events = [
    'drop', 'dragstart', 'dragenter', 'dragover', 'dragleave', 'dragend'
  ];

  /**
   * @name: onDataChange
   * @methodOf: DataService
   *
   * @param {newArr} updated data
   * @param {oldArr} old data
   *
   * @description
   * $watch callback method
   */
  DataFactory.prototype.currentBrowser = function() {
    var result, browser_agent = $window.navigator.userAgent;

    if (browser_agent.indexOf(".NET") != -1) {
      result = "IE";
    } else if (browser_agent.indexOf("Firefox") != -1) {
      result = "Firefox";
    } else {
      result = "Chrome";
    }
    return result;
  };

  return {
    getInstance: function() {
      return new DataFactory();
    }
  };
}