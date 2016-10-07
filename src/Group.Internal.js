/* globals module */
/**
 * Internal Data Group.
 *
 * @class Kartographer.Data.Group.Internal
 * @extends Kartographer.Data.Group.HybridGroup
 */
module.exports = function ( extend, createPromise, HybridGroup, ExternalGroup, DataLoader ) {

	var InternalGroup = function () {
		// call the constructor
		this.initialize.apply( this, arguments );
	};

	extend( InternalGroup.prototype, HybridGroup.prototype );

	/**
	 * @return {jQuery.Promise}
	 */
	InternalGroup.prototype.fetch = function () {
		var group = this,
			deferred;

		if ( group.promise ) {
			return group.promise;
		}

		group.promise = deferred = createPromise();

		DataLoader.fetchGroup( group.id ).then( function ( apiGeoJSON ) {
			group.parse( apiGeoJSON ).then( function ( group ) {
				return group.fetchExternalGroups();
			} ).then( function () {
				deferred.resolve();
			} );
		} );

		return group.promise;
	};
	return InternalGroup;
};
