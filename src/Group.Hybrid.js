/**
 * A hybrid group is a group that is not considered as a {@link Kartographer.Data.Group.HybridGroup}
 * because it does not implement a `fetch` method.
 *
 * This abstraction is useful for the Developer API: the data is passed directly but still needs to
 * be parsed to extract the external sub-groups.
 *
 * @class Kartographer.Data.Group.HybridGroup
 * @extends Kartographer.Data.Group
 * @param {Function} extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} createResolvedPromise
 * @param {Function} isPlainObject Reference to e.g. {@see jQuery.isPlainObject}
 * @param {Function} whenAllPromises Reference to e.g. {@see jQuery.when}
 * @param {Function} Group Reference to the {@see Kartographer.Data.Group} class
 * @param {Function} ExternalGroup Reference to the {@see Kartographer.Data.Group.External}
 *  constructor
 * @param {Kartographer.Data.DataStore} dataStore
 * @param {Function} [log]
 * @return {Function}
 */
module.exports = function (
	extend,
	createResolvedPromise,
	isPlainObject,
	whenAllPromises,
	Group,
	ExternalGroup,
	dataStore,
	log
) {

	var HybridGroup = function () {
		// call the constructor
		this.initialize.apply( this, arguments );
	};

	function isExternalDataGroup( data ) {
		return isPlainObject( data ) && data.type && data.type === 'ExternalData';
	}

	extend( HybridGroup.prototype, Group.prototype );

	HybridGroup.prototype.initialize = function ( groupId, geoJSON, options ) {
		options = options || {};

		Group.prototype.initialize.call( this, groupId, geoJSON, options );
		this.externals = [];
		this.isExternal = false;
	};

	/**
	 * @return {Promise}
	 */
	HybridGroup.prototype.load = function () {
		return this.parse( this.getGeoJSON() ).then( function ( group ) {
			return group.fetchExternalGroups();
		}, function () {
			if ( log ) {
				log( 'warn', 'HybridGroup getGeoJSON failed: ' + JSON.stringify( arguments ) );
			}
		} );
	};

	/**
	 * @return {Promise}
	 */
	HybridGroup.prototype.fetchExternalGroups = function () {
		var promises = [],
			group = this,
			i,
			externals = group.externals;

		for ( i = 0; i < externals.length; i++ ) {
			promises.push( externals[ i ].fetch() );
		}

		return whenAllPromises( promises ).then( function () {
			return group;
		}, function () {
			if ( log ) {
				log( 'warn', 'HybridGroup fetchExternalGroups failed: ' + JSON.stringify( arguments ) );
			}
		} );
	};

	/**
	 * Parses the GeoJSON to extract the external data sources.
	 *
	 * Creates {@link Kartographer.Data.Group.External external data groups} and
	 * keeps references of them in {@link #externals}.
	 *
	 * @param {Object[]|Object} apiGeoJSON The GeoJSON as returned by the API.
	 * @return {Promise}
	 */
	HybridGroup.prototype.parse = function ( apiGeoJSON ) {
		var group = this,
			geoJSON,
			externalKey,
			i;

		group.apiGeoJSON = apiGeoJSON;
		apiGeoJSON = JSON.parse( JSON.stringify( apiGeoJSON ) );
		if ( Array.isArray( apiGeoJSON ) ) {
			geoJSON = [];
			for ( i = 0; i < apiGeoJSON.length; i++ ) {
				if ( isExternalDataGroup( apiGeoJSON[ i ] ) ) {
					externalKey = JSON.stringify( apiGeoJSON[ i ] );
					group.externals.push(
						dataStore.get( externalKey ) ||
						dataStore.add( new ExternalGroup( externalKey, apiGeoJSON[ i ] ) )
					);
				} else {
					geoJSON.push( apiGeoJSON[ i ] );
				}
			}
		} else if ( isExternalDataGroup( apiGeoJSON ) ) {
			externalKey = JSON.stringify( apiGeoJSON );
			group.externals.push(
				dataStore.get( externalKey ) ||
				dataStore.add( new ExternalGroup( externalKey, apiGeoJSON ) )
			);
			geoJSON = {};
		}

		group.geoJSON = geoJSON;

		return createResolvedPromise( group );
	};

	return HybridGroup;
};
