# angular-jsend

An AngularJS module providing a wrapper around $http that handles JSend responses.

v0.1.1

## Overview

Use this module in your AngularJS app if your API sends responses formatted in accordance with the [JSend](http://labs.omniti.com/labs/jsend) specification.

## Installation

```
bower install angular-jsend --save
```

## Usage

Add `jsend` as a dependency to your module:

```javascript
var app = angular.module('app', ['jsend']);
```

Assume you have an `api` service that makes calls to your API and that your API responds with JSend objects:

```javascript
app.service('api', function (jsend) {
    
    // Gets all users and returns a promise.
    this.getUsers = function () {
        return jsend({
            method: 'GET',
            url: '/api/v1/users'
        });
    };

    // Gets all users that are administrators.
    this.getAdmins = function () {
        return jsend({
            method: 'GET',
            url: '/api/v1/users',
            params: {
                admin: true
            }
        });
    }
});

```

## Features

How is calling `jsend(config)` different that calling `$http(config)`?

The `angular-jsend` utility provides a few features that help you deal with JSend responses.

- Calling `jsend` returns a promise that is resolved or rejected *based on the JSend status* and not the HTTP response status code. This is important. You may have an API where all responses are returned using a 200 (OK) response but the JSend status could be `fail` or `error`. The promise is rejected regardless of the 200 (OK) HTTP response status.

- If your API returns a standard HTTP response such as 404 (Not Found) *but does not return a JSend object*, then a JSend object is created with the appropriate `status`, `code`, and  `message` properties and the promise is rejected with this object.

## API

```javascript
jsend(config).then(successCallback, errorCallback);
```

The `jsend` module exports the `jsend` method. This method takes the same `config` parameter as the `$http` method. However, the response is always guaranteed to be a JSend object and the returned promise is resolved only if the JSend status is `success`. Otherwise, the promise is rejected with a JSend object having a status of `fail` or `error`.

## Synthetic Error Responses

If the endpoint called by the five `jsend` method returns a standard HTTP response with a body that is *not* formatted as a JSend object, then a synthetic JSend error response object is created from the HTTP status code and message. The `status` property of this response object will be set to `"error"` and the `code` property will be set to the HTTP status code.

This is done so that your app only has to deal with JSend responses and need not have special handling for non-successful HTTP responses. Note that this *only* occurs if the API endpoint does *not* send back a JSend object. This allows you to send back JSend `fail` or `error` responses while also setting the HTTP status code to a meaningful value thereby complying with established REST principles.

For example, returning the following...

```javascript
{
    "status": "fail",
    "data": {
        "title": "A title is required when creating a new post."
    }
}
```

...along with an HTTP status code of 400 (Bad Request), will *not* cause a synthetic error response to be created as the response already is a JSend object. As a matter of fact, if this `fail` response were returned with a 200 (OK) status code, the promise would *still* be rejected since the JSend status indicates that the request was not successful.

## Parting Thoughts

Originally, this module had many more features and tried to mimic much of the `$http` service. But there were enough edge cases where a simple promise wrapper around the `$http` service made the most sense. The idea is that you would most probably use `jsend` in a service and that service would abstract the complexity away from your controllers (as it should be). Therefore, crafting the `config` object for each call is not a big deal as it is something that can be localized to such a service.

## License

(The MIT License)

Copyright (c) 2015 Buchanan & Edwards

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
