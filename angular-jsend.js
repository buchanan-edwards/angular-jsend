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

    // Processes the JSend response for an HTTP success and returns a JSend
    // response object.
    function httpSuccess(response) {
        var obj;
        if (isJSendResponse(response.data)) {
            obj = response.data;
        } else {
            obj = {
                status: 'success',
                data: res.status === 204 ? null : res.data
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

    //------------------------------------------------------------------------
    // PROVIDER FUNCTION
    //------------------------------------------------------------------------

    function jsendProvider() {

        //--------------------------------------------------------------------
        // PROVIDER CONFIGURATION
        //--------------------------------------------------------------------

        var _base = '';
        var _callback = null;
        var _debug = false;

        this.setBase = function (base) {
            if (typeof base !== 'string') {
                throw new Error('base must be a string');
            }
            _base = base;
        };

        this.setCallback = function (callback) {
            if (typeof callback !== 'function') {
                throw new Error('callback must be a function');
            }
            _callback = callback;
        };

        this.setDebug = function (debug) {
            if (typeof debug !== 'boolean') {
                throw new Error('debug must be a boolean');
            }
            _debug = debug;
        };

        //--------------------------------------------------------------------
        // SERVICE FUNCTION
        //--------------------------------------------------------------------

        this.$get = function ($http, $q, $log, strformat) {

            //----------------------------------------------------------------
            // SERVICE HELPERS
            //----------------------------------------------------------------

            // Creates a URL using strformat.
            function makeUrl(args) {
                var path = strformat.apply(null, args);
                if (path.substr(0, 4) === 'http') {
                    return path; // do not prepend base if absolute
                } else {
                    return _base + path;
                }
            }

            // Executes the HTTP request specified by the config object.
            function http(config) {
                var deferred = $q.defer();
                if (_callback) {
                    _callback.call(config, null);
                }
                $http(config).then(function (response) {
                    resolveOrReject(deferred, config, httpSuccess(response));
                }, function (response) {
                    resolveOrReject(deferred, config, httpError(response));
                });
                return deferred.promise;
            }

            // Resolves or rejects the promise depending on the JSend status.
            function resolveOrReject(deferred, config, obj) {
                if (_debug) {
                    debug(config, obj);
                }
                if (_callback) {
                    _callback.call(config, obj);
                }
                if (obj.status === 'success') {
                    deferred.resolve(obj);
                } else {
                    deferred.reject(obj);
                }
            }

            // Logs the response and alerts on fail or error.
            function debug(config, response) {
                if (response.status === 'success') {
                    $log.debug(config.method, config.url, response);
                } else {
                    $log.error(config.method, config.url, response);
                    var req = config.method + ' ' + config.url;
                    var res = angular.toJson(response, 4);
                    alert(req + '\n' + res);
                }
            }

            //----------------------------------------------------------------
            // JSEND CLASS
            //----------------------------------------------------------------

            function JSend(url) {
                this.url = url;
            }

            JSend.prototype.get = function (params) {
                return http({
                    url: this.url,
                    method: 'GET',
                    params: params
                });
            };

            JSend.prototype.put = function (data) {
                return http({
                    url: this.url,
                    method: 'PUT',
                    data: data
                });
            }

            JSend.prototype.post = function (data) {
                return http({
                    url: this.url,
                    method: 'POST',
                    data: data
                });
            }

            JSend.prototype.delete = function () {
                return http({
                    url: this.url,
                    method: 'PATCH',
                    data: data
                });
            }

            return function () {
                var url = makeUrl(Array.prototype.slice.call(arguments));
                return new JSend(url);
            };
        }
    }

    module.provider('jsend', jsendProvider);
})(angular.module('jsend', ['strformat']));
