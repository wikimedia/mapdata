/**
 * @class Kartographer.Data.Group
 */

/**
 * @param {Object|Object[]} [geoJSON] The group's geometry, or empty for
 *   incomplete ExternalData.
 * @constructor
 */
var Group = function ( geoJSON ) {
	this.geoJSON = geoJSON || null;
	/**
	 * {boolean} Flag is true if the group failed to fully load.
	 */
	this.failed = false;
	/**
	 * {Error|null} Details about a failure, if any.
	 */
	this.failureReason = null;
};

/**
 * @return {Object|null} Group GeoJSON
 */
Group.prototype.getGeoJSON = function () {
	return this.geoJSON;
};

/**
 * Set data to flag this group as failed.
 *
 * @param {Error} err
 */
Group.prototype.fail = function ( err ) {
	this.failed = true;
	this.failureReason = err;
};

module.exports = Group;
