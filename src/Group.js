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
 * @param {Object} [geoJSON=null] Geometry as an object.
 * @param {Object} [options={}] Additional options for the group.
 * @param {string} [options.attribution] Attribution to display on the map layer.
 * @constructor
 */
var Group = function ( groupId, geoJSON, options ) {
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
