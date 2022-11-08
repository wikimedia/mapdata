[![npm](https://img.shields.io/npm/v/@wikimedia/mapdata.svg?style=flat)](https://www.npmjs.com/package/@wikimedia/mapdata)

# Wikimedia MapData

Wikimedia MapData is a library for use in the MediaWiki [Kartographer extension](https://www.mediawiki.org/wiki/Extension:Kartographer) and [Kartotherian snapshot](https://github.com/kartotherian/snapshot) service.

## Introduction

The library takes a list of ids, downloads the map data from the MediaWiki API, parses map data, extracts the external data, and downloads the external data. Once the process is complete, a list of internal and external data groups is returned. The geoJson for each groups is returned with `group.getGeoJSON()`.

The library first requires wrapper methods to be passed in order to be used both on client-side and server-side.

## Install

```
npm install git+https://gerrit.wikimedia.org/r/mapdata --save
```

## Required wrapper methods

* `createPromise`
* `whenAllPromises`: A reference to e.g. `jQuery.when`
* `isEmptyObject`: A reference to e.g. `jQuery.isEmptyObject`
* `isPlainObject`: A reference to e.g. `jQuery.isPlainObject`
* `extend`: A reference to e.g. `jQuery.extend`
* `getJSON`: A reference to e.g. `jQuery.getJSON`
* `mwApi`: A reference to the `mw.Api` constructor
* `mwHtmlElement`: A reference to the `mw.html.element` function
* `mwUri`: A reference to the `mw.Uri` constructor
* `title`

## Example for use on client-side

```js
// Configure data manager with wrapper methods
var dataManager = require( './DataManager' )( {

  /**
   * @required same as JS6 new Promise:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
   */
  createPromise: function ( callback ) {
    var promise = $.Deferred();
    try {
      callback( promise.resolve.bind( promise ), promise.reject.bind( promise ) );
    } catch (err) {
      promise.reject( err );
    }
    return promise;
  },

  /**
   * @required
   */
  whenAllPromises( promises ) {
    return $.when.apply( $, promises );
  },

  /**
   * @required
   */
  isEmptyObject: function () {
    return $.isEmptyObject.apply( $, arguments );
  },

  /**
   * @required
   */
  isPlainObject: function () {
    return $.isPlainObject.apply( $, arguments );
  },

  /**
   * @required
   */
  extend: function () {
    return $.extend.apply( $, arguments );
  },

  /**
   * @required
   */
  getJSON: function ( url ) {
    return $.getJSON( url );
  },

  /**
   * @required
   */
  mwApi: function ( data ) {
    return new mw.Api()[ 'get' ]( data );
  },

  /**
   * @required
   */
  title: mw.config.get( 'wgPageName' ),

  /**
   * @optional
   */
  mwHtmlElement: function () {
    return mw.html.element.apply( mw.html, arguments );
  },

  /**
   * @optional
   */
  mwUri: function ( data ) {
    return new mw.Uri( data );
  },

  /**
   * @optional
   */
  clientStore: mw.config.get( 'wgKartographerLiveData' ),

  /**
   * @optional
   */
  debounce: function () {
    return mw.util.debounce.apply( mw.util, arguments );
  },

  /**
   * @optional
   */
  mwMsg: function () {
    return mw.msg.apply( mw.msg, arguments );
  }
} );

// Download and build map geojson for a list of groups:
DataManager.loadGroups( groupIds ).then( function ( dataGroups ) {
  var mapGeoJSON, group;

  for (var i = 0; i < dataGroups.length; i++ ) {
    group = dataGroups[ i ];

    if (dataGroups.length > 1) {
      mapGeoJSON = mapGeoJSON || [];
      mapGeoJSON.push( group.getGeoJSON() );
    } else {
      mapGeoJSON = group.getGeoJSON();
    }
  }
} );
```
