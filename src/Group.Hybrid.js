/* globals module */
/**
 * Internal Data Group.
 *
 * @class Kartographer.Data.Group.HybridGroup
 * @extends Kartographer.Data.Group
 */
module.exports = function ( extend, createPromise, isPlainObject, isArray, whenAllPromises, Group, ExternalGroup, DataLoader, DataStore ) {

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
		this.isExternal = false;
		this.externals = [];
	};

	/**
	 * @return {jQuery.Promise}
	 */
	HybridGroup.prototype.load = function () {
		var group = this;

		return group.parse( group.getGeoJSON() ).then( function ( group ) {
			return group.fetchExternalGroups();
		} );
	};

	/**
	 * @return {jQuery.Promise}
	 */
	HybridGroup.prototype.fetchExternalGroups = function () {
		var promises = [],
			deferred = createPromise(),
			group = this,
			key,
			externals = group.externals;

		for ( key in externals ) {
			promises.push( externals[ key ].fetch() );
		}

		return whenAllPromises( promises ).then( function () {
			return deferred.resolve( group ).promise();
		} );
	};

	/**
	 * @return {jQuery.Promise}
	 */
	HybridGroup.prototype.parse = function ( apiGeoJSON ) {
		var group = this,
			deferred = createPromise(),
			geoJSON,
			externalKey,
			i;

		group.apiGeoJSON = apiGeoJSON;
		apiGeoJSON = JSON.parse( JSON.stringify( apiGeoJSON ) );
		if ( isArray( apiGeoJSON ) ) {
			geoJSON = [];
			for ( i = 0; i < apiGeoJSON.length; i++ ) {
				if ( isExternalDataGroup( apiGeoJSON[ i ] ) ) {
					externalKey = JSON.stringify( apiGeoJSON[ i ] );
					group.externals.push(
						DataStore.get( externalKey ) ||
						DataStore.add( new ExternalGroup( externalKey, apiGeoJSON[ i ] ) )
					);
				} else {
					geoJSON.push( apiGeoJSON[ i ] );
				}
			}
		} else if ( isExternalDataGroup( geoJSON ) ) {
			externalKey = JSON.stringify( geoJSON );
			group.externals.push(
				DataStore.get( externalKey ) ||
				DataStore.add( new ExternalGroup( externalKey, geoJSON ) )
			);
			geoJSON = {};
		}

		group.geoJSON = geoJSON;

		return deferred.resolve( group ).promise();
	};

	return HybridGroup;
};
