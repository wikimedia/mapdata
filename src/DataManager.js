var dataLoaderLib = require( './MapdataLoader' ),
	Group = require( './Group' ),
	ExternalDataLoader = require( './ExternalDataLoader' ),
	ExternalDataParser = require( './ExternalDataParser' );

/**
 * @param {Array|Object} data
 * @return {Array} Data wrapped in an array if necessary.
 */
function toArray( data ) {
	if ( Array.isArray( data ) ) {
		return data;
	} else {
		return [ data ];
	}
}

/**
 * @class Kartographer.Data.DataManager
 * @param {Object} wrappers
 * @param {Object} [wrappers.clientStore] External cache of groups, supplied by the caller.
 * @param {Function} wrappers.createPromise
 * @param {Function} wrappers.extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} wrappers.getJSON Reference to e.g. {@see jQuery.getJSON}
 * @param {Function} wrappers.isEmptyObject Reference to e.g. {@see jQuery.isEmptyObject}
 * @param {Function} wrappers.isPlainObject Reference to e.g. {@see jQuery.isPlainObject}
 * @param {Function} wrappers.mwApi Reference to the {@see mw.Api} constructor
 * @param {Function} wrappers.whenAllPromises Reference a function like {@see Promise.all}
 * @constructor
 */
module.exports = function ( wrappers ) {

	var createResolvedPromise = function ( value ) {
			return wrappers.createPromise( function ( resolve ) {
				resolve( value );
			} );
		},
		dataLoader = dataLoaderLib(
			wrappers.extend,
			createResolvedPromise,
			wrappers.mwApi,
			wrappers.clientStore
		),
		externalDataLoader = ExternalDataLoader(
			wrappers.getJSON,
			wrappers.createPromise
		),
		externalDataParser = ExternalDataParser(
			wrappers.isPlainObject,
			wrappers.isEmptyObject,
			wrappers.extend
		),
		DataManager = function () {};

	/**
	 * Restructure the geoJSON from a single group, splitting out external data
	 * each into a separate group, and leaving any plain data bundled together.
	 *
	 * @param {Object|Object[]} geoJSON
	 * @return {Kartographer.Data.Group[]}
	 */
	function splitExternalGroups( geoJSON ) {
		var groups = [];
		var plainData = [];
		toArray( geoJSON ).forEach( function ( data ) {
			if ( externalDataParser.isExternalData( data ) ) {
				groups.push( new Group( data ) );
			} else {
				plainData.push( data );
			}
		} );
		if ( plainData.length ) {
			groups.push( new Group( plainData ) );
		}
		return groups;
	}

	/**
	 * Expand ExternalData for the group
	 *
	 * @param {Kartographer.Data.Group} group
	 * @return {Kartographer.Data.Group[]} groups The original group, plus any
	 * retrieved external data each as a separate group.
	 */
	function fetchExternalData( group ) {
		if ( !externalDataParser.isExternalData( group.getGeoJSON() ) ) {
			return createResolvedPromise( group );
		}
		return externalDataLoader.fetch( group )
			.then( function ( data ) {
				// Side-effect of parse is to update the group.
				externalDataParser.parse( group, data );
				return group;
			} )
			.catch( function ( err ) {
				group.fail( err );
				return group;
			} );
	}

	/**
	 * Fetch all mapdata and contained ExternalData.
	 *
	 * @param {string[]|string} groupIds List of group ids to load (will coerce
	 * from a string if needed).
	 * @param {string} [title] Will be ignored when revid is supplied
	 * @param {string|false} [revid] Either title or revid must be set.
	 * If false or missing, falls back to a title-only request.
	 * @return {Promise<Group[]>} Resolves with a list of expanded Group objects.
	 */
	DataManager.prototype.loadGroups = function ( groupIds, title, revid ) {
		groupIds = toArray( groupIds );
		// Fetch mapdata for all groups from MediaWiki.
		return dataLoader.fetchGroups(
			groupIds,
			title,
			revid
		).then( function ( mapdata ) {
			return groupIds.reduce( function ( groups, id ) {
				var groupData = mapdata[ id ];

				// Handle failed groups by replacing with an error.
				if ( !groupData ) {
					var group = new Group();
					group.fail( new Error( 'Received empty response for group "' + id + '"' ) );
					groups.push( group );
					return groups;
				}

				return groups.concat( splitExternalGroups( groupData ) );
			}, [] );
		} ).then( function ( groups ) {
			return groups.map( fetchExternalData );
		} ).then(
			wrappers.whenAllPromises
		);
	};

	/**
	 * Load any ExternalData contained by the given geojson
	 *
	 * @param {Object|Object[]} geoJSON
	 * @return {Promise<Kartographer.Data.Group[]>}
	 */
	DataManager.prototype.load = function ( geoJSON ) {
		return wrappers.whenAllPromises(
			splitExternalGroups( geoJSON )
				.map( function ( group ) {
					return fetchExternalData( group );
				} )
		);
	};

	return new DataManager();
};
