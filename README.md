# angular-jsend

An AngularJS module providing HTTP methods that process the responses as JSend objects.

v0.0.4

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
        return jsend('/api/v1/users').get();
    };

    // Gets a single user and returns a promise.
    this.getUser = function (userId) {
        return jsend('/api/v1/users/{0}', userId).get();
    }
});

```

## Features

How is calling `jsend(<url>).get()` any different that just calling `$http.get()`?

The `angular-jsend` utility provides a few features that help you deal with JSend responses.

1. The `jsend` function creates a URL based on string formatting using the [angular-strformat](https://github.com/fhellwig/strformat) module. This allows you to be creative in how you generate the URL. The object returned by `jsend` has the five methods (`get`, `put`, `post`, `patch`, and `delete`) bound to the URL created by `jsend`.

2. Calling one of the five methods returns a promise that is resolved or rejected *based on the JSend status* and not the HTTP response status code. This is important. You may have an API where all responses are returned using a 200 (OK) response but the JSend status could be `fail` or `error`. The promise is rejected regardless of the 200 (OK) HTTP response status.

3. If your API returns a standard HTTP response such as 404 (Not Found) *but does not return a JSend object*, then a JSend object is created with the appropriate `status`, `code`, and  `message` properties and the promise is rejected with this object.

4. The `jsendProvider` can be configured using a relative base so that you need not prefix each URL with the part that is common to each call. In the example above, all calls start with `/api/v1`. Calling `jsendProvider.setRelativeBase('/api/v1')` in your module configuration takes care of this.

5. You may want to display an alert for any JSend promise rejections. The `jsendProvider` allows such global handlers to be specified so that your code does not require reject handlers for every call.

## API

### Provider API

The `jsendProvider` can be configured in your module using four methods. These set global values that apply to all `jsend` calls made within that module.

```javascript
jsendProvider.setRelativeBase(base)
```

Specifies a string that is prepended all URLs *not* beginning with `http` (i.e., all non-absolute URLs). This is useful if all of your API calls are rooted at a standard path such as `/api/v1`.

```javascript
jsendProvider.setNotifyCallback(callback)
```

Specifies a function that is called at the beginning of any `jsend` call. The callback function will be called with one argument (`config`) where `config` is the configuration object that was used to generate the request.

```javascript
jsendProvider.setSuccessCallback(callback)
```

Specifies a function that is called whenever a `jsend` promise is resolved. The callback function will be called with two arguments (`config`, `response`) where `config` is the configuration object that was used to generate the request and `response` is the entire JSend response object. The `status` property of the response object will be set to `"success"`.

```javascript
jsendProvider.setErrorCallback(callback)
```

Specifies a function that is called whenever a `jsend` promise is rejected. The callback function will be called with two arguments (`config`, `response`) where `config` is the configuration object that was used to generate the request and `response` is the entire JSend response object. The `status` property of the response object will be set to either `"fail"` or `"error"`.

#### Alert Error Handler

For debugging, or plain lazyness, you can specify a default alert error handler by simply passing the string `"alert"` to the `setErrorCallback` configuration function like this: `jsendProvider.setErrorCallback('alert');`. The method, URL, and response will be presented in a browser alert popup.

### Service API

The `jsend` service can be injected into your own services or controllers. It is a function (not an object or instance) that creates a set of methods when called. These methods are all bound to the URL created by the `jsend` function.

**Do this:**

```javascript
jsend('/users/{0}', userId).get().then(...);
```
**Do NOT do this:**

```javascript
jsend.get(...).then(...);
```

The `jsend` service function uses the [angular-strformat](https://github.com/fhellwig/strformat) module to format your URL. Since there can be an arbitrary number of placeholders (`{0}`, `{1}`, etc.), there is no way of knowing when the replacement values end and the optional `params` object (`get`) or `data` object (`put`, `post`, and `patch`) begins. Therefore, the `params` and `data` objects are passed to the HTTP method while the `jsend` service method creates the URL.

```javascript
jsend(url, ...)
```

Creates a URL from the specified string performing placeholder replacement and prepending the relative base (if specified by the provider). Returns an object having five HTTP methods that are all bound to this URL.

```javascript
jsend(url, ...).get(params)
```

Performs an HTTP GET request. The optional `params` are encoded and added as the query string to the URL. Returns a promise that is resolved or rejected based on the returned JSend object status or the HTTP status if the response does not look like a JSend object.

```javascript
jsend(url, ...).put(data)
```

Performs an HTTP PUT request. The `data` object specifies the request body. Returns a promise that is resolved or rejected based on the returned JSend object status or the HTTP status if the response does not look like a JSend object.

```javascript
jsend(url, ...).post(data)
```

Performs an HTTP POST request. The `data` object specifies the request body. Returns a promise that is resolved or rejected based on the returned JSend object status or the HTTP status if the response does not look like a JSend object.

```javascript
jsend(url, ...).patch(data)
```

Performs an HTTP PATCH request. The `data` object specifies the request body. Returns a promise that is resolved or rejected based on the returned JSend object status or the HTTP status if the response does not look like a JSend object.


```javascript
jsend(url, ...).delete()
```

Performs an HTTP DELETE request. Returns a promise that is resolved or rejected based on the returned JSend object status or the HTTP status if the response does not look like a JSend object.

#### A Worked GET Example

Assume we want to perform a GET for a specific user's security information and we want the results to omit any personally identifiable information (PII). The full URL for this fictitious example is:

    /api/v1/users/19321/security?pii=false

For this example, let's also assume that we have a `request` object that looks like this:

```javascript
var request = {
    userId: 19321,
    information: 'security'
};
```

Here is one possibility for what the `jsend` GET call could look like:

```javascript
jsend('/api/v1/users/{userId}/{information}', request).get({
    pii: false
});
```

Notice that the URL is constructed using property name placeholders (`{userId}` and `{information}`) and that the query parameters are specified as a `params` object. Finally, we could have omitted the `/api/v1` prefix by specifying it using the `jsendProvider.setRelativeBase('/api/v1')` configuration setting.

### Synthetic Error Responses

If the endpoint called by one of the five `jsend` request methods returns a standard HTTP response with a body that is *not* formatted as a JSend object, then a synthetic JSend error response object is created from the HTTP status code and message. The `status` property of this response object will be set to `"error"` and the `code` property will be set to the HTTP status code.

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

## License

(The MIT License)

Copyright (c) 2015 Buchanan & Edwards

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
