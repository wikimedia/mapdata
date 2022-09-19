var dataLoaderLib = require( './DataLoader' ),
	Group = require( './Group.js' ),
	externalGroupLib = require( './Group.External' ),
	dataStoreLib = require( './DataStore' ),
	hybridGroupLib = require( './Group.Hybrid' ),
	internalGroupLib = require( './Group.Internal' );

/**
 * @class Kartographer.Data.DataManager
 * @param {Object} wrappers
 * @param {Object} [wrappers.clientStore]
 * @param {Function} wrappers.createPromise
 * @param {Function} [wrappers.debounce] Reference to e.g. {@see jQuery.debounce}
 * @param {Function} wrappers.extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} wrappers.getJSON Reference to e.g. {@see jQuery.getJSON}
 * @param {Function} wrappers.isEmptyObject Reference to e.g. {@see jQuery.isEmptyObject}
 * @param {Function} wrappers.isPlainObject Reference to e.g. {@see jQuery.isPlainObject}
 * @param {Function} wrappers.mwApi Reference to the {@see mw.Api} constructor
 * @param {Function} wrappers.mwHtmlElement Reference to the {@see mw.html.element} function
 * @param {Function} [wrappers.mwMsg] Reference to the {@see mw.msg} function
 * @param {Function} wrappers.mwUri Reference to the {@see mw.Uri} constructor
 * @param {string} [wrappers.title] Will be ignored when revid is supplied
 * @param {string|false} [wrappers.revid] Either title or revid must be set. If false or missing,
 *  falls back to a title-only request.
 * @param {Function} wrappers.whenAllPromises Reference to e.g. {@see jQuery.when}
 * @param {Function} [wrappers.log]
 * @constructor
 */
module.exports = function ( wrappers ) {

	var createResolvedPromise = function ( value ) {
			return wrappers.createPromise( function ( resolve ) {
				resolve( value );
			} );
		},
		dataLoader = dataLoaderLib(
			wrappers.createPromise,
			createResolvedPromise,
			wrappers.mwApi,
			wrappers.clientStore,
			wrappers.title,
			wrappers.revid,
			wrappers.debounce,
			wrappers.log
		),
		ExternalGroup = externalGroupLib(
			wrappers.extend,
			wrappers.isEmptyObject,
			wrappers.getJSON,
			wrappers.mwMsg,
			wrappers.mwUri,
			wrappers.mwHtmlElement,
			Group,
			wrappers.log
		),
		dataStore = dataStoreLib(),
		HybridGroup = hybridGroupLib(
			wrappers.extend,
			createResolvedPromise,
			wrappers.isPlainObject,
			wrappers.whenAllPromises,
			Group,
			ExternalGroup,
			dataStore,
			wrappers.log
		),
		InternalGroup = internalGroupLib(
			wrappers.extend,
			HybridGroup,
			dataLoader,
			wrappers.log
		),
		DataManager = function () {};

	/**
	 * @param {string[]|string} groupIds List of group ids to load.
	 * @return {Promise}
	 */
	DataManager.prototype.loadGroups = function ( groupIds ) {
		var promises = [];

		if ( !Array.isArray( groupIds ) ) {
			groupIds = [ groupIds ];
		}
		for ( var i = 0; i < groupIds.length; i++ ) {
			var group = dataStore.get( groupIds[ i ] ) ||
				dataStore.add( new InternalGroup( groupIds[ i ] ) );
			// eslint-disable-next-line no-loop-func
			promises.push( wrappers.createPromise( function ( resolve ) {
				group.fetch().then( resolve, resolve );
			} ) );
		}

		dataLoader.fetch();

		return wrappers.whenAllPromises( promises ).then( function () {
			var groupList = [];

			for ( var i = 0; i < groupIds.length; i++ ) {
				var group = dataStore.get( groupIds[ i ] );
				if ( group.failed || !wrappers.isEmptyObject( group.getGeoJSON() ) ) {
					groupList = groupList.concat( group );
				}
				groupList = groupList.concat( group.externals );
			}

			return groupList;
		}, function () {
			if ( wrappers.log ) {
				wrappers.log( 'warn', 'DataManager loadGroups failed: ' + JSON.stringify( arguments ) );
			}
		} );
	};

	/**
	 * @param {Object} geoJSON
	 * @return {Promise}
	 */
	DataManager.prototype.load = function ( geoJSON ) {
		var group = new HybridGroup( null, geoJSON );

		return group.load().then( function () {
			var groupList = [];

			if ( !wrappers.isEmptyObject( group.getGeoJSON() ) ) {
				groupList = groupList.concat( group );
			}

			return groupList.concat( group.externals );
		}, function () {
			if ( wrappers.log ) {
				wrappers.log( 'warn', 'DataManager load failed: ' + JSON.stringify( arguments ) );
			}
		} );
	};

	return new DataManager();
};
