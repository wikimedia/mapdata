# wikimedia-mapdata

Wikimedia map data is a library for use in the mediawiki [Kartographer extension](https://www.mediawiki.org/wiki/Extension:Kartographer)  and [Kartotherian snapshot](https://github.com/kartotherian/kartotherian-snapshot) service.

## Introduction

The library takes a list of ids, downloads the map data from the mediawiki API, parses map data, extracts the external data, and downloads the external data. Once the process is complete, a list of internal and external data groups is returned. The geoJson for each groups is returned with `group.getGeoJSON()`.

The library first requires wrapper methods to be passed in order to be used both on client-side and server-side.

## Install

```
npm install juliengirault/wikimedia-mapdata --save
```

## Required wrapper methods

* `createPromise`
* `whenAllPromises`
* `isEmptyObject`
* `isPlainObject`
* `isArray`
* `extend`
* `getJSON`
* `mwApi`
* `mwUri`
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
	isArray: function () {
		return $.isArray.apply( $, arguments );
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
		return $.debounce.apply( $, arguments );
	},

	/**
     * @optional
     */
	bind: function () {
		return $.proxy.apply( $, arguments );
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
