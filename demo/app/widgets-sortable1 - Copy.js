/**
 * @author: Shoukath Mohammed   
 */
(function() {

  'use strict';

  var DragDropDataModel = function() {
    this._events = [
      'drop', 'dragstart', 'dragenter', 'dragover', 'dragleave', 'dragend'
    ];

    this._options = {
      'sortBy': null,
      'inUse': false,
      'storage': null,
      'active': false,
      'replace': false,
      'hasDragHandle': false
    };

    this._destItem = {};
    this._sourceItem = {};
    this._destIndex = null;
    this._sourceIndex = null;

    this._currentBrowser = (function() {
      var result
      , browser_agent = window.navigator.userAgent;

      if (browser_agent.indexOf(".NET") != -1) {
        result = "IE";
      } else if (browser_agent.indexOf("Firefox") != -1) {
        result = "Firefox";
      } else {
        result = "Chrome";
      }
      return result;
    })();
  };

  DragDropDataModel.prototype._version = "1.0.1";

  DragDropDataModel.prototype._toTitleCase = function() {
    return this._events.map(function(ev) {
      return ev.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    });
  }

  DragDropDataModel.prototype._setItem = function(key, value) {
    if (!key || !value) {
      throw new Error("Key & Value must be defined!");
    }
    this[(key.indexOf('_') == -1) ? ("_" + key) : key] = value;
  }

  DragDropDataModel.prototype._sort = function(arr, prop) {
    if (!this._data || !prop) return;
    arr = arr || this._data;

    return arr.sort(function(a, b) {
      return a[prop] - b[prop];
    });
  }

  angular.module('angular-html-drag-drop', []);

  angular
      .module('angular-html-drag-drop')
      .service('DragDropService', DragDropService);

  function DragDropService() {
    var self = this;
    var current;

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
  }


  angular
      .module('angular-html-drag-drop')
      .directive('ngHtmlDragDrop', ngHtmlDragDrop);

  ngHtmlDragDrop.$inject = ["$parse", "$timeout", "$log", "$window", "DragDropService"];

  function ngHtmlDragDrop($parse, $timeout, $log, $window, DragDropService) {

    return {
      restrict: 'A',
      require: '?ngModel',
      scope: {
        ngHtmlDragDrop: '='
      },
            //scope: true,   // optionally create a child scope
      link: link
    };

    function link(scope, element, attrs, ngModel) {
        var dataModel = new DragDropDataModel();

        var sortable = {};
        sortable.is_handle = false;
        sortable.in_use = false;

        sortable.handleDragStart = function(e) {

          if (sortable.options && angular.isDefined(sortable.options.disableDrag)) {
            if (sortable.options.disableDrag(ngModel.$modelValue, angular.element(this)) === true) {
              e.preventDefault();
              return;
            }
          }

          $window['drag_source'] = null;
          $window['drag_source_extra'] = null;

          if (sortable.options && !sortable.is_handle && sortable.options.handle) {
            e.preventDefault();
            return;
          }

          sortable.is_handle = false;
          e.dataTransfer.effectAllowed = 'move';
          //Fixed on firefox and IE 11
          if (sortable.browser != "IE") {
            e.dataTransfer.setData('text/plain', 'anything');
          }


          $window['drag_source'] = this;
          $window['drag_source_extra'] = element.extra_data;

          // this/e.target is the source node.
          this.classList.add('moving');
        };


        sortable.handleDrop = function(e) {
          // this/e.target is current target element.
          if (e.stopPropagation) {
            // stops the browser from redirecting.
            e.stopPropagation();
          }
          e.preventDefault();
          this.classList.remove('over');

          // Don't do anything if we're dropping on the same column we're dragging.
          if ($window['drag_source'] != this) {

            if ($window['drag_source'] == null) {
              $log.info("Invalid sortable");
              return;
            }


            var source_model = $window['drag_source'].model;
            var drop_index = this.index;

            if (ngModel.$modelValue.indexOf(source_model) != -1) {

              var drag_index = $window['drag_source'].index;
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
              sortable.options.stop(ngModel.$modelValue, drop_index,
                element.extra_data, $window['drag_source_extra']);
            }
          }
          return false;
        };

        sortable.handleDragEnd = function(e) {
          // this/e.target is the source node.
          [].forEach.call(sortable.cols_, function(col) {
            col.classList.remove('over');
            col.classList.remove('moving');
          });

        };

        //Unbind all events are registed before
        sortable.unbind = function() {

          $log.info('Unbind sortable');
          [].forEach.call(sortable.cols_, function(col) {
            col.removeAttribute('draggable');
            col.removeEventListener('dragstart', sortable.handleDragStart, false);
            col.removeEventListener('dragenter', DragDropService.handleDragEnter, false);
            col.removeEventListener('dragover', DragDropService.handleDragOver, false);
            col.removeEventListener('dragleave', DragDropService.handleDragLeave, false);
            col.removeEventListener('drop', sortable.handleDrop, false);
            col.removeEventListener('dragend', sortable.handleDragEnd, false);
          });
          sortable.in_use = false;
        }

        sortable.activehandle = function($event) {
          //$event.preventDefault();
          sortable.is_handle = true;
        }

        sortable.register_drop = function(element_children) {
          element_children.addEventListener('drop', sortable.handleDrop, false);
          element_children.addEventListener('dragstart', sortable.handleDragStart, false);
          element_children.addEventListener('dragenter', DragDropService.handleDragEnter, false);
          element_children.addEventListener('dragover', DragDropService.handleDragOver, false);
          element_children.addEventListener('dragleave', DragDropService.handleDragLeave, false);
          element_children.addEventListener('drop', sortable.handleDrop, false);
          element_children.addEventListener('dragend', sortable.handleDragEnd, false);
        }

       /* sortable.getBrowser = function() {
          var browser_agent = $window.navigator.userAgent;
          if (browser_agent.indexOf(".NET") != -1) {
            //IE 11
            return "IE";
          } else if (browser_agent.indexOf("Firefox") != -1) {
            return "Firefox";
          } else {
            return "Chrome";
          }
        }*/

        sortable.update = function() {
          $log.info("Update sortable:");
          $window['drag_source'] = null;
          var index = 0;

          //This's empty list, so just need listen drop from other
          if (ngModel.$modelValue.length == 0) {
            if (element[0].children.length > 0) {
              //Set index = 0( simulate first index )
              element[0].children[0].index = 0;
              sortable.register_drop(element[0].children[0]);
            }
            return;
          }

          //this.browser = this.getBrowser();
          this.cols_ = element[0].children;

          [].forEach.call(this.cols_, function(col) {
            if (sortable.options && sortable.options.handle) {
              var handles = document.querySelectorAll(sortable.options.handle);

              if (handles && handles.length) {
                [].forEach.call(handles, function(handle) {
                  var el = angular.element(handle);
                  el.unbind('mousedown', sortable.activehandle);
                  el.bind('mousedown', sortable.activehandle);
                  //el.attr('draggable', true);
                });
              }
            }

            col.index = index;
            col.model = ngModel.$modelValue[index];

            index++;

            col.setAttribute('draggable', 'true'); // Enable columns to be draggable.
            sortable.register_drop(col);
          });

          sortable.in_use = true;
        }

        if (ngModel) {
          ngModel.$render = onModelRender.bind(this, 
            scope, 
            element, 
            attrs, 
            ngModel, 
            sortable
          );
        } else {
          $log.info('Missing ng-model in template');
        }
    }

    function onModelRender(scope, element, attrs, ngModel, sortable) {
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
                  if (sortable.in_use) {
                    sortable.unbind();
                    sortable.in_use = false;
                  }
                  return;
                }

                if (!angular.isDefined(sortable.options)) {
                  sortable.options = {};
                }

                if (!angular.isDefined(sortable.options.allow_cross)) {
                  sortable.options.allow_cross = false
                }

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
  }


})();