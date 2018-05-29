/**
 * Data store.
 *
 * @class Kartographer.Data.DataStore
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
	 * @return {Map<string, Kartographer.Data.Group>}
	 */
	DataStore.prototype.getAll = function () {
		return this.groups;
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
