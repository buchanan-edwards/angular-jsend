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

(function (module) {

    //------------------------------------------------------------------------
    // UTILITY FUNCTIONS
    //------------------------------------------------------------------------

    // Returns true if the specified value is a real object.
    // Note that null and arrays are not considered objects.
    function isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    // Returns true if the specified value is a JSend response.
    // The specified value is considered a JSend repsonse if it
    // is a real object and has a valid JSend status property.
    function isJSendResponse(value) {
        return isObject(value) && typeof value.status === 'string' &&
            (value.status === 'success' || value.status === 'fail' || value.status === 'error');
    }

    //------------------------------------------------------------------------
    // PROVIDER FUNCTION
    //------------------------------------------------------------------------

    function provider() {

        //--------------------------------------------------------------------
        // PROVIDER CONFIGURATION
        //--------------------------------------------------------------------

        var _relativeBase = '';
        var _notifyCallback = null;
        var _successCallback = null;
        var _errorCallback = null;

        this.setRelativeBase = function (base) {
            _relativeBase = base;
        };

        this.setNotifyCallback = function (callback) {
            _notifyCallback = callback;
        };

        this.setSuccessCallback = function (callback) {
            _successCallback = callback;
        };

        this.setErrorCallback = function (callback) {
            if (callback === 'alert') {
                _errorCallback = alertErrorCallback;
            } else {
                _errorCallback = callback;
            }
        };

        function alertErrorCallback(config, response) {
            alert(config.method + ' ' + config.url + '\n' + angular.toJson(response, 4));
        }

        //--------------------------------------------------------------------
        // PROVIDER HELPERS
        //--------------------------------------------------------------------

        // Processes the JSend response for an HTTP success.
        function httpSuccess(response, deferred) {
            var obj = response.data;
            if (!isJSendResponse(obj)) {
                obj = {
                    status: 'success',
                    data: res.status === 204 ? null : res.data
                };
            }
            if (obj.status === 'success') {
                if (typeof _successCallback === 'function') {
                    _successCallback(response.config, obj);
                }
                deferred.resolve(obj);
            } else {
                if (typeof _errorCallback === 'function') {
                    _errorCallback(response.config, obj);
                }
                deferred.reject(obj);
            }
        }

        // Processes the JSend response for an HTTP error.
        // Note that the JSend status could still indicate success.
        function httpError(response, deferred) {
            var obj = response.data;
            if (isJSendResponse(obj)) {
                if (obj.status === 'error') {
                    if (typeof obj.code !== 'number') {
                        obj.code = response.status;
                    }
                    if (typeof obj.message !== 'string') {
                        obj.message = response.statusText;
                    }
                }
            } else {
                obj = {
                    status: 'error',
                    code: response.status,
                    message: response.statusText
                };
            }
            if (obj.status === 'success') {
                if (typeof _successCallback === 'function') {
                    _successCallback(response.config, obj);
                }
                deferred.resolve(obj);
            } else {
                if (typeof _errorCallback === 'function') {
                    _errorCallback(response.config, obj);
                }
                deferred.reject(obj);
            }
        }

        //--------------------------------------------------------------------
        // SERVICE FUNCTION
        //--------------------------------------------------------------------

        this.$get = function ($http, $q, strformat) {

            // Creates a URL using strformat.
            function makeUrl(args) {
                var path = strformat.apply(null, args);
                if (path.substr(0, 4) === 'http') {
                    return path; // do not prepend base if absolute
                } else {
                    return _relativeBase + path;
                }
            }

            // Executes the HTTP request specified by the config object.
            function http(config) {
                var deferred = $q.defer();
                if (typeof _notifyCallback === 'function') {
                    _notifyCallback(config);
                }
                $http(config).then(function (response) {
                    httpSuccess(response, deferred);
                }, function (response) {
                    httpError(response, deferred);
                });
                return deferred.promise;
            }

            // Creates a GET function bound to the specified URL.
            function fnGet(url) {
                return function (params) {
                    return http({
                        url: url,
                        method: 'GET',
                        params: params
                    });
                };
            }

            // Creates a PUT function bound to the specified URL.
            function fnPut(url) {
                return function (data) {
                    return http({
                        url: url,
                        method: 'PUT',
                        data: data
                    });
                };
            }

            // Creates a POST function bound to the specified URL.
            function fnPost(url) {
                return function (data) {
                    return http({
                        url: url,
                        method: 'POST',
                        data: data
                    });
                };
            }

            // Creates a PATCH function bound to the specified URL.
            function fnPatch(url) {
                return function (data) {
                    return http({
                        url: url,
                        method: 'PATCH',
                        data: data
                    });
                };
            }

            // Creates a DELETE function bound to the specified URL.
            function fnDelete(url) {
                return function (data) {
                    return http({
                        url: url,
                        method: 'DELETE'
                    });
                };
            }

            return function () {
                var url = makeUrl(Array.prototype.slice.call(arguments));
                console.log('IN THE FUNCTION', url);
                return {
                    get: fnGet(url),
                    put: fnPut(url),
                    post: fnPost(url),
                    patch: fnPatch(url),
                    delete: fnDelete(url)
                };
            };
        }
    }

    module.provider('jsend', provider);
})(angular.module('jsend'));
