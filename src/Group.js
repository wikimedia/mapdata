/**
 * Group parent class.
 *
 * Contains the data fields common to every subclass of Group.
 *
 * @class Kartographer.Data.Group
 * @abstract
 */

/**
 * @param {string} groupId Either a group name defined in the mapframe, or an
 *   automatically-generated hash of the group's contents.
 * @param {Object|Object[]} [geoJSON=null] The group's geometry, or empty for
 *   incomplete ExternalData.
 * @param {Object} [options={}] Additional options for the group.
 * @param {string} [options.attribution] Attribution to display on the map layer.
 * @constructor
 */
var Group = function ( groupId, geoJSON, options ) {
	this.id = groupId;
	this.geoJSON = geoJSON || null;
	this.options = options || {};
	/**
	 * {boolean} Flag is true if the group failed to fully load.
	 */
	this.failed = false;
	/**
	 * {Error|null} Details about any failure.
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
 * @return {string} Group annotation
 */
Group.prototype.getAttribution = function () {
	return this.options.attribution;
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
