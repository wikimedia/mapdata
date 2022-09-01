/**
 * @class Kartographer.Data.Group.Internal
 * @extends Kartographer.Data.Group.HybridGroup
 * @param {Function} extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} HybridGroup Reference to the {@see Kartographer.Data.Group.HybridGroup} class
 * @param {Kartographer.Data.DataLoader} dataLoader
 * @param {Function} [log]
 * @return {Function}
 */
module.exports = function ( extend, HybridGroup, dataLoader, log ) {

	var InternalGroup = function () {
		// call the constructor
		this.initialize.apply( this, arguments );
	};

	extend( InternalGroup.prototype, HybridGroup.prototype );

	/**
	 * @return {Promise}
	 */
	InternalGroup.prototype.fetch = function () {
		var group = this;

		if ( group.promise ) {
			return group.promise;
		}

		group.promise = dataLoader.fetchGroup( group.id ).then( function ( apiGeoJSON ) {
			return group.parse( apiGeoJSON ).then( function ( group ) {
				return group.fetchExternalGroups();
			} );
		}, function () {
			if ( log ) {
				log( 'warn', 'InternalGroup fetchGroup failed: ' + JSON.stringify( arguments ) );
			}
			group.failed = true;
		} );
		return group.promise;
	};
	return InternalGroup;
};
