  'use strict';

  var DragDropDataModel = function() {
    this._events = [
      'drop', 'dragstart', 'dragenter', 'dragover', 'dragleave', 'dragend'
    ];

    this._options = {
      'sortBy': null,
      'inUse': false,
      'isHandle': false,
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
      var result, browser_agent = window.navigator.userAgent;

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