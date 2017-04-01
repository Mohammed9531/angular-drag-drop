/**
 * angular-drag-drop.js v1.0.1
 * --------------------------------------------------------------------
 *
 * AngularJS Drag & Drop Directive
 * @author Shoukath Mohammed <mshoukath.uideveloper@gmail.com>
 *
 * Copyright (C) 2017
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

 ;(function() {
"use strict";

angular.module('angular-html-drag-drop', []);
 

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

DragDropService.$inject = [
  '$timeout',
  '$log',
  '$window',
  '$document',
  '$rootScope'
];

function DragDropService($timeout, $log, $window, $document, $rootScope) {

  // {jshint} complains about possible strict violation
  // adding this line below skips the validation 
  /*jshint validthis: true */

  // adding this line below skips dot notation validation
  /*jshint sub:true*/
  var DRAG_EVENTS = [
      'drop'
    , 'dragstart'
    , 'dragenter'
    , 'dragover'
    , 'dragleave'
    , 'dragend'
  ]

  // data factory that holds the data for each instance
  , DataFactory = function() {
    var self = this;

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

    this.cols = [];
    this.destItem = {};
    this.sourceItem = {};
    this.destIndex = null;
    this.sourceIndex = null;


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
      var _str = toTitleCase(str)
      , suffix = _str.substring(_str.indexOf("g") + 1);
      return _str.replace(suffix, toTitleCase(suffix));
    }

    function onDataRendered() {
      // init flag indicate the first load sortable is done or not
      self.first_load = false;
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
    };


    this.addClass = function(current) {
      if (!current.classList.contains('over')) {
        current.classList.add('over');
      }
    };

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

      // allows us to drop
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = 'move';
      self.addClass(current);
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
      self.addClass(current);
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
    };

    /**
     * @name: handleDrop
     * @methodOf: DataService
     *
     * @param {Object | e} triggered event
     *
     * @description
     * triggered when dragging activity is completed
     */
    this.handleDrop = function(e) {
      self.destItem = e.currentTarget;

      // this/e.target is current target element.
      // stops the browser from redirecting.
      if (e.stopPropagation) {
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
     * @name: updateModel
     * @methodOf: DataService
     *
     * @description
     * rearranges model data on drag end
     */
    this.updateModel = function() {
      var dragIndex = self.sourceItem.index
      , dragModel = self.sourceItem.model
      , dropIndex = self.destItem.index
      , dropModel = self.destItem.model
      , _model = self.options.properties.models || {}
      , draggedItemCopy = angular.copy(_model.$modelValue[dragIndex]);

      if (_model.$modelValue.indexOf(dragModel) != -1) {
        self.unregister();
        if (self.options.replace) {
          _model.$modelValue[dragIndex] = dropModel;
          _model.$modelValue[dropIndex] = dragModel;
        } else {
          _model.$modelValue.splice(dragIndex, 1);
          _model.$modelValue.splice(dropIndex, 0, draggedItemCopy);
        }
      } else {
        $log.info("Invalid action");
        return;
      }

      // emits draggableEnd event when dragging activing is completed
      self.onEnd = $rootScope.$emit("draggableEnd", {
        model: _model,
        dropIndex: dropIndex,
        dragModel: dragModel,
        dropModel: _model.$viewValue[dropIndex],
        dragIndex: dragIndex
      });
    };

    /**
     * @name: update
     * @methodOf: DataService
     *
     * @description
     * registers elements to drag & drop events
     * attaches index & data model to each element children
     */
    this.update = function() {
      self.sourceItem = null;

      var index = 0
      , _model = self.options.properties.models || {};
      self.cols = self.cols || [];

      // iterate over list of draggable element
      [].forEach.call(self.cols, function(col) {
        if (self.options && self.options.handle) {
          self.updateHandles();
        }

        // set index on each element to consume it 
        // in re-arraging the elements based on the src & dest indexes
        col.index = index;

        // attach model to the element to be consumed on drag end
        col.model = _model.$modelValue[index];
        index++;

        // make columns draggable
        col.setAttribute('draggable', 'true');

        // register to drag & drop events
        self.register(col);
      });
      self.options.isHandle = true;
      $log.info("Update sortable:");
    };

    /**
     * @name: activeHandle
     * @methodOf: DataService
     *
     * @description
     * activates handle on when mouseup on the element
     */
    this.activeHandle = function() {
      self.options.isHandle = true;
    };

    /**
     * @name: updateHandles
     * @methodOf: DataService
     *
     * @description
     * updates drag and drop handles on child elements
     */
    this.updateHandles = function() {
      // find list of element with handles
      var handles = $document[0].querySelectorAll(self.options.handle);
      // if there's a list of elements found
      // bind mousedown event to each element
      if (handles && handles.length) {
        [].forEach.call(handles, function(handle) {
          var el = angular.element(handle);

          // if element is not empty, bind event to it
          // remove previously bound events if any
          if (angular.isObject(el)) {
            el.unbind('mousedown', self.activeHandle);
            el.bind('mousedown', self.activeHandle);
          }
        });
      }
    };

    /**
     * @name: handleDragStart
     * @methodOf: DataService
     *
     * @param {Object | e} triggered event
     *
     * @description
     * triggered when element is dragged
     */
    this.handleDragStart = function(e) {
      var current = e.currentTarget;

      // reset sourceItem on drag start
      self.sourceItem = null;
      if (self.options && !self.options.isHandle && self.options.handle) {
        e.preventDefault();
        return;
      }

      self.options.isHandle = false;
      e.dataTransfer.effectAllowed = 'move';

      // fixed on firefox and IE 11
      if (self.currentBrowser != "IE") {
        e.dataTransfer.setData('text/plain', 'anything');
      }
      self.sourceItem = current;

      // this/e.target is the source node.
      current.classList.add('moving');
    };

    /**
     * @name: register
     * @methodOf: DataService
     *
     * @description
     * binds drag & drop events to the element
     */
    this.register = function(el) {
      self.eventsProcessor(el, 'addEventListener');
    };

    /**
     * @name: unregister
     * @methodOf: DataService
     *
     * @description
     * unbinds/removes drag & drop events from the element
     */
    this.unregister = function() {
      self.options.isHandle = false;

      [].forEach.call(self.cols, function(col) {
        col.removeAttribute('draggable');
        self.eventsProcessor(col, 'removeEventListener');
      });
    };

    /**
     * @name: eventsProcessor
     * @methodOf: DataService
     *
     * @param {el} element to bind events to
     * @param {action | addEventListener| removeEventListener} 
     *
     * @description
     * helper function to perform add or remove event listeners
     */
    this.eventsProcessor = function(el, action) {
      for (var i = 0; i < self.events.length; i++) {
        el[action](self.events[i], self["handle" 
        +  getSuffix(self.events[i])], false);
      }
    };
  }

  /**
   * @name: events
   *
   * @description
   * list of drag & drop events
   */
  DataFactory.prototype.events = DRAG_EVENTS;

  /**
   * @name: currentBrowser
   * @methodOf: DataService
   *
   * @description
   * detects the current browser
   * currently used to avoid drag & drop issues on IE
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
}());
