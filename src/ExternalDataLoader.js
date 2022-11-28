/**
 * Factory function returning an instance.
 *
 * @param {Function} getJSON
 * @param {Function} createPromise
 * @return {Kartographer.Data.ExternalDataLoader}
 */
module.exports = function (
	getJSON,
	createPromise
) {
	/**
	 * @class Kartographer.Data.ExternalDataLoader
	 * @constructor
	 */
	var ExternalDataLoader = function () {};

	/**
	 * @param {Kartographer.Data.Group} group
	 * @return {Promise} Resolved with the raw, externally-fetched data.
	 */
	ExternalDataLoader.prototype.fetch = function ( group ) {
		var data = group.getGeoJSON();

		if ( !data || !data.url ) {
			return createPromise( function ( _resolve, reject ) {
				reject( new Error( 'ExternalData has no url' ) );
			} );
		}

		return getJSON( data.url );
	};

	return new ExternalDataLoader();
};
