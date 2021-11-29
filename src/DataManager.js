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
 * @param {Function} [wrappers.debounce]
 * @param {Function} wrappers.extend
 * @param {Function} wrappers.getJSON
 * @param {Function} wrappers.isEmptyObject
 * @param {Function} wrappers.isPlainObject
 * @param {Function} wrappers.mwApi
 * @param {Function} wrappers.mwHtmlElement
 * @param {Function} [wrappers.mwMsg]
 * @param {Function} wrappers.mwUri
 * @param {string} wrappers.title
 * @param {string} wrappers.revid
 * @param {Function} wrappers.whenAllPromises
 * @constructor
 */
module.exports = function ( wrappers ) {

	var createResolvedPromise = function ( value ) {
			return wrappers.createPromise( function ( resolve ) {
				resolve( value );
			} );
		},
		DataLoader = dataLoaderLib(
			wrappers.createPromise,
			createResolvedPromise,
			wrappers.mwApi,
			wrappers.clientStore,
			wrappers.title,
			wrappers.revid,
			wrappers.debounce
		),
		ExternalGroup = externalGroupLib(
			wrappers.extend,
			wrappers.isEmptyObject,
			wrappers.getJSON,
			wrappers.mwMsg,
			wrappers.mwUri,
			wrappers.mwHtmlElement,
			Group
		),
		DataStore = dataStoreLib(),
		HybridGroup = hybridGroupLib(
			wrappers.extend,
			createResolvedPromise,
			wrappers.isPlainObject,
			wrappers.whenAllPromises,
			Group,
			ExternalGroup,
			DataStore
		),
		InternalGroup = internalGroupLib(
			wrappers.extend,
			HybridGroup,
			DataLoader
		),
		DataManager = function () {};

	/**
	 * @param {string[]|string} groupIds List of group ids to load.
	 * @return {Promise}
	 */
	DataManager.prototype.loadGroups = function ( groupIds ) {
		var promises = [],
			group,
			i;

		if ( !Array.isArray( groupIds ) ) {
			groupIds = [ groupIds ];
		}
		for ( i = 0; i < groupIds.length; i++ ) {
			group = DataStore.get( groupIds[ i ] ) || DataStore.add( new InternalGroup( groupIds[ i ] ) );
			// eslint-disable-next-line no-loop-func
			promises.push( wrappers.createPromise( function ( resolve ) {
				group.fetch().then( resolve, resolve );
			} ) );
		}

		DataLoader.fetch();

		return wrappers.whenAllPromises( promises ).then( function () {
			var groupList = [],
				group,
				i;

			for ( i = 0; i < groupIds.length; i++ ) {

				group = DataStore.get( groupIds[ i ] );
				if ( group.failed || !wrappers.isEmptyObject( group.getGeoJSON() ) ) {
					groupList = groupList.concat( group );
				}
				groupList = groupList.concat( group.externals );
			}

			return groupList;
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
		} );
	};

	return new DataManager();
};
