/* globals module */
/**
 * Data Manager.
 *
 * @class Kartographer.Data.DataManager
 */

module.exports = function ( wrappers ) {

	var DataLoader = require( './DataLoader' )(
		wrappers.createPromise,
		wrappers.mwApi,
		wrappers.clientStore,
		wrappers.title,
		wrappers.debounce,
		wrappers.bind
		),
		Group = require( './Group.js' ),
		ExternalGroup = require( './Group.External' )(
			wrappers.extend,
			wrappers.createPromise,
			wrappers.isEmptyObject,
			wrappers.isArray,
			wrappers.getJSON,
			wrappers.mwMsg,
			wrappers.mwUri,
			Group
		),
		DataStore = require( './DataStore' ),
		HybridGroup = require( './Group.Hybrid' )(
			wrappers.extend,
			wrappers.createPromise,
			wrappers.isPlainObject,
			wrappers.isArray,
			wrappers.whenAllPromises,
			Group,
			ExternalGroup,
			DataLoader,
			DataStore
		),
		InternalGroup = require( './Group.Internal' )(
			wrappers.extend,
			wrappers.createPromise,
			HybridGroup,
			ExternalGroup,
			DataLoader
		),
		DataManager = function () {};

	/**
	 * @param {string[]} groupIds List of group ids to load.
	 * @return {jQuery.Promise}
	 */
	DataManager.prototype.loadGroups = function ( groupIds ) {
		var promises = [],
			groupList = [],
			deferred = wrappers.createPromise(),
			group,
			i;

		for ( i = 0; i < groupIds.length; i++ ) {
			group = DataStore.get( groupIds[ i ] ) || DataStore.add( new InternalGroup( groupIds[ i ] ) );
			promises.push( group.fetch() );
		}

		DataLoader.fetch();

		wrappers.whenAllPromises( promises ).then( function () {
			for ( i = 0; i < groupIds.length; i++ ) {

				group = DataStore.get( groupIds[ i ] );
				if ( !wrappers.isEmptyObject( group.getGeoJSON() ) ) {
					groupList = groupList.concat( group );
				}
				groupList = groupList.concat( group.externals );
			}

			return deferred.resolve( groupList );
		} );
		return deferred;
	};

	/**
	 * @param {Object} geoJSON
	 * @return {jQuery.Promise}
	 */
	DataManager.prototype.load = function ( geoJSON ) {
		var groupList = [],
			group = new HybridGroup( null, geoJSON ),
			deferred = wrappers.createPromise();

		group.load().then( function () {

			if ( !wrappers.isEmptyObject( group.getGeoJSON() ) ) {
				groupList = groupList.concat( group );
			}
			groupList = groupList.concat( group.externals );

			return deferred.resolve( groupList );
		} );
		return deferred;
	};

	return new DataManager();
};
