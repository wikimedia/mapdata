/**
 * Data Manager.
 *
 * @class Kartographer.Data.DataManager
 */
var dataLoaderLib = require( './DataLoader' ),
	Group = require( './Group.js' ),
	externalGroupLib = require( './Group.External' ),
	dataStoreLib = require( './DataStore' ),
	hybridGroupLib = require( './Group.Hybrid' ),
	internalGroupLib = require( './Group.Internal' );

module.exports = function ( wrappers ) {

	var createResolvedPromise = function ( value ) {
			return wrappers.createPromise( function ( resolve ) {
				resolve( value );
			} );
		},
		getGroupIdsToExclude = function ( groupIds ) {
			return groupIds.filter( function ( groupId ) {
				return groupId.indexOf( '-' ) === 0;
			} ).map( function ( groupId ) {
				return groupId.slice( 1 );
			} );
		},
		DataLoader = dataLoaderLib(
			wrappers.createPromise,
			createResolvedPromise,
			wrappers.mwApi,
			wrappers.clientStore,
			wrappers.title,
			wrappers.debounce,
			getGroupIdsToExclude
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
			DataLoader,
			DataStore
		),
		InternalGroup = internalGroupLib(
			wrappers.extend,
			HybridGroup,
			ExternalGroup,
			DataLoader
		),
		DataManager = function () {};

	/**
   * @param {string[]} groupIds List of group ids to load.
   * @return {Promise}
   */
	DataManager.prototype.loadGroups = function ( groupIds ) {
		var promises = [],
			group,
			groupId,
			allGroups,
			groupIdsToExclude,
			i;

		function pushPromiseForGroup( group ) {
			promises.push( wrappers.createPromise( function ( resolve ) {
				group.fetch().then( resolve, resolve );
			} ) );
		}

		if ( !Array.isArray( groupIds ) ) {
			groupIds = [ groupIds ];
		}
		if ( groupIds.indexOf( 'all' ) === -1 ) {
			for ( i = 0; i < groupIds.length; i++ ) {
				group = DataStore.get( groupIds[ i ] ) || DataStore.add( new InternalGroup( groupIds[ i ] ) );
				pushPromiseForGroup( group );
			}
		} else {
			groupIdsToExclude = getGroupIdsToExclude( groupIds );
			allGroups = DataStore.getAll();
			for ( groupId in allGroups ) {
				if ( allGroups.hasOwnProperty( groupId ) && groupIdsToExclude.indexOf( groupId ) === -1 ) {
					pushPromiseForGroup( allGroups[ groupId ] );
				}
			}
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
