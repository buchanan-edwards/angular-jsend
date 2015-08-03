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

    var JSEND_SUCCESS = 'success';
    var JSEND_FAIL = 'fail';
    var JSEND_ERROR = 'error';

    // Returns true if the specified argument is a real object.
    // Note that null and arrays are not considered objects.
    function isObject(obj) {
        return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
    }

    // Returns true if the argument is a valid JSend status string.
    function isValidStatus(status) {
        return typeof status === 'string' && (
            status === JSEND_SUCCESS ||
            status === JSEND_FAIL ||
            status === JSEND_ERROR);
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
                status: JSEND_SUCCESS,
                data: response.status === 204 ? null : response.data
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
            if (obj.status === JSEND_ERROR) {
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
                    status: JSEND_ERROR,
                    code: response.status,
                    message: response.statusText
                };
            } else {
                obj = {
                    status: JSEND_ERROR,
                    code: 0,
                    message: 'Cannot reach the server.'
                };
            }
        }
        return obj;
    }

    module.factory('jsend', function($rootScope, $http, $q, $log) {
        // Calls $http(config) and returns a promise that is resolved or rejected
        // based on the JSend status. The responses are logged using $log.
        return function(config) {
            $rootScope.$broadcast('jsend:request', config)
            return $http(config).then(
                function(response) {
                    return httpSuccess(response);
                },
                function(response) {
                    return httpError(response);
                }
            ).then(
                function(response) {
                    var msg = '[jsend:' + response.status + ']';
                    switch (response.status) {
                        case JSEND_SUCCESS:
                            $log.debug(msg, config, response);
                            break;
                        case JSEND_FAIL:
                            $log.warn(msg, config, response);
                            break;
                        case JSEND_ERROR:
                            $log.error(msg, config, response);
                            break;
                    }
                    $rootScope.$broadcast('jsend:response', config, response)
                    if (response.status === JSEND_SUCCESS) {
                        return response;
                    } else {
                        return $q.reject(response);
                    }
                }
            );
        }
    });
})(angular.module('jsend', []));
