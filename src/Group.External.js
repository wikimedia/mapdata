/**
 * @class Kartographer.Data.Group.External
 * @extends Kartographer.Data.Group
 *
 * All parameters are dependency injections and should be removed in the future, see T322722.
 *
 * @param {Function} extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} getJSON Reference to e.g. {@see jQuery.getJSON}
 * @param {Function} Group Reference to the {@see Kartographer.Data.Group} class
 * @param {Kartographer.Data.ExternalDataParser} parser
 * @return {Function}
 */
module.exports = function (
	extend,
	getJSON,
	Group,
	parser
) {

	var ExternalGroup = function () {
		Group.prototype.constructor.apply( this, arguments );

		/** Constant flag signaling that this group was defined in ExternalData. */
		this.isExternal = true;
	};

	extend( ExternalGroup.prototype, Group.prototype );

	/**
	 * @return {Promise}
	 */
	ExternalGroup.prototype.fetch = function () {
		var group = this,
			data = group.geoJSON;

		if ( group.promise ) {
			return group.promise;
		}

		if ( !data.url ) {
			throw new Error( 'ExternalData has no url' );
		}

		group.promise = getJSON( data.url ).then( function ( geodata ) {
			return parser.parse( group, geodata );
		} );

		return group.promise;
	};

	return ExternalGroup;
};
