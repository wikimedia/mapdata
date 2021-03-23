/**
 * @class Kartographer.Data.DataStore
 * @constructor
 */
module.exports = function () {

	var DataStore = function () {
		this.groups = {};
	};

	/**
	 * @param {Kartographer.Data.Group} group
	 * @return {Kartographer.Data.Group}
	 */
	DataStore.prototype.add = function ( group ) {
		this.groups[ group.id ] = group;
		return group;
	};

	/**
	 * @param {string} groupId
	 * @return {Kartographer.Data.Group}
	 */
	DataStore.prototype.get = function ( groupId ) {
		return this.groups[ groupId ];
	};

	/**
	 * @param {string} groupId
	 * @return {boolean}
	 */
	DataStore.prototype.has = function ( groupId ) {
		return ( groupId in this.groups );
	};

	return new DataStore();
};
