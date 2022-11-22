/**
 * @class Kartographer.Data.Group.External
 * @extends Kartographer.Data.Group
 *
 * All parameters are dependency injections and should be removed in the future, see T322722.
 *
 * @param {Function} extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} Group Reference to the {@see Kartographer.Data.Group} class
 * @param {Kartographer.Data.ExternalDataLoader} loader
 * @param {Kartographer.Data.ExternalDataParser} parser
 * @return {Function}
 */
module.exports = function (
	extend,
	Group,
	loader,
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
		if ( !this.promise ) {
			var group = this;
			this.promise = loader.fetch( this ).then( function ( geodata ) {
				return parser.parse( group, geodata );
			} );
		}
		return this.promise;
	};

	return ExternalGroup;
};
