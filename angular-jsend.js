/*
 * Copyright (c) 2015 Buchanan & Edwards
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function(module) {

  // Returns true if the specified argument is a real object.
  // Note that null and arrays are not considered objects.
  function isObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }

  // Returns true if the argument is a valid JSend status string.
  function isValidStatus(status) {
    return typeof status === 'string' && (
      status === 'success' ||
      status === 'fail' ||
      status === 'error');
  }

  // Returns true if the specified value is a JSend response.
  // The specified value is considered a JSend repsonse if it
  // is a real object and has a valid JSend status property.
  function isJSendResponse(response) {
    return isObject(response) && isValidStatus(response.status);
  }

  // Processes the JSend response for an HTTP success and returns a JSend
  // response object.
  function httpSuccess(response) {
    var obj;
    if (isJSendResponse(response.data)) {
      obj = response.data;
    } else {
      obj = {
        status: 'success',
        data: response.status === 204 ? null : res.data
      };
    }
    return obj;
  }

  // Processes the JSend response for an HTTP error and returns a JSend
  // response object. Although the HTTP status could have been an error,
  // the status in the JSend response object can still indicate success.
  function httpError(response) {
    var obj;
    if (isJSendResponse(response.data)) {
      obj = response.data;
      if (obj.status === 'error') {
        if (typeof obj.code !== 'number') {
          obj.code = response.status;
        }
        if (typeof obj.message !== 'string') {
          obj.message = response.statusText;
        }
      }
    } else {
      if (response.status) {
        obj = {
          status: 'error',
          code: response.status,
          message: response.statusText
        };
      } else {
        obj = {
          status: 'error',
          code: 0,
          message: 'Cannot reach the server.'
        };
      }
    }
    return obj;
  }

  module.factory('jsend', function($http, $q, $log) {
    // Calls $http(config) and returns a promise that is resolved or rejected
    // based on the JSend status. The responses are logged using $log.
    return function(config) {
      return $http(config).then(
        function(response) {
          return httpSuccess(response);
        },
        function(response) {
          return httpError(response);
        }
      ).then(function(response) {
        var req = config.method + ' ' + config.url;
        switch (response.status) {
          case 'success':
            $log.debug(req, response);
            return response;
            break;
          case 'fail':
            $log.warn(req, response);
            return $q.reject(response);
            break;
          case 'error':
            $log.error(req, response);
            return $q.reject(response);
            break;
        }
      });
    }
  });
})(angular.module('jsend', []));
