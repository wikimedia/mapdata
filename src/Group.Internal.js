/**
 * @class Kartographer.Data.Group.Internal
 * @extends Kartographer.Data.Group.HybridGroup
 *
 * All parameters are dependency injections and should be removed in the future, see T322722.
 *
 * @param {Function} extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} HybridGroup Reference to the {@see Kartographer.Data.Group.HybridGroup} class
 * @param {Kartographer.Data.DataLoader} dataLoader
 * @return {Function}
 */
module.exports = function ( extend, HybridGroup, dataLoader ) {

	var InternalGroup = function () {
		HybridGroup.prototype.constructor.apply( this, arguments );
	};

	extend( InternalGroup.prototype, HybridGroup.prototype );

	/**
	 * @return {Promise}
	 */
	InternalGroup.prototype.fetch = function () {
		if ( this.promise ) {
			return this.promise;
		}

		var group = this;
		this.promise = dataLoader.fetchGroup( this.id ).then( function ( apiGeoJSON ) {
			return group.parse( apiGeoJSON ).then( function ( group ) {
				return group.fetchExternalGroups();
			} );
		} );
		return this.promise;
	};
	return InternalGroup;
};
