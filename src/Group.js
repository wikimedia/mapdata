/**
 * @class Kartographer.Data.Group
 * @property {Object|Object[]|null} geoJSON
 * @property {string|null} name The group key in mapdata.
 * @property {boolean} failed Flag is true if the group failed to fully load.
 * @property {Error|null} failureReason Details about a failure, if any.
 *
 * @constructor
 * @param {Object|Object[]} [geoJSON] The group's geometry, or empty for
 *   incomplete ExternalData.
 */
var Group = function ( geoJSON ) {
	this.geoJSON = geoJSON || null;
	this.name = null;
	this.failed = false;
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
