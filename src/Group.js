/**
 * Group parent class.
 *
 * @class Kartographer.Data.Group
 * @extends L.Class
 * @abstract
 */

/**
 * @param {string} groupId
 * @param {Object} [geoJSON]
 * @param {Object} [options]
 * @constructor
 */
var Group = function () {
	// call the constructor
	this.initialize.apply( this, arguments );
};

Group.prototype.initialize = function ( groupId, geoJSON, options ) {
	this.id = groupId;
	this.geoJSON = geoJSON || null;
	this.options = options || {};
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

module.exports = Group;
