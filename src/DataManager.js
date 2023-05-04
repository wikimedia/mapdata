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
 * Factory function returning an instance.
 *
 * @param {Object} wrappers
 * @param {Object} [wrappers.clientStore] External cache of groups, supplied by the caller.
 * @param {Function} wrappers.createPromise
 * @param {Function} wrappers.extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} wrappers.getJSON Reference to e.g. {@see jQuery.getJSON}
 * @param {Function} wrappers.isEmptyObject Reference to e.g. {@see jQuery.isEmptyObject}
 * @param {Function} wrappers.isPlainObject Reference to e.g. {@see jQuery.isPlainObject}
 * @param {Function} wrappers.mwApi Reference to {@see mw.Api.get}
 * @param {Function} wrappers.whenAllPromises Reference a function like {@see Promise.all}
 * @return {Object}
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
		);

	/**
	 * Expand GeoJSON by fetching any linked ExternalData
	 *
	 * @param {Object|Object[]} geoJSON
	 * @param {string} [name] Group ID to assign to the name field, if applicable.
	 * @return {Promise<Group[]>} resolves to a list of expanded groups.  The
	 *   first group contains all successful data, and subsequent groups are a
	 *   stub holding failure metadata.
	 * @public
	 */
	function loadExternalData( geoJSON, name ) {
		var expandedData = [],
			failures = [];

		var fetchThreads = toArray( geoJSON )
			.map( function ( data ) {
				return fetchExternalData( data )
					.then( Array.prototype.push.bind( expandedData ) )
					.catch( Array.prototype.push.bind( failures ) );
			} );

		return wrappers.whenAllPromises( fetchThreads )
			.then( function () {
				var group = new Group( expandedData );
				if ( name ) {
					group.name = name;
				}
				return [ group ].concat(
					failures.map( function ( err ) {
						var errGroup = new Group();
						errGroup.fail( err );
						return errGroup;
					} ) );
			} );
	}

	/**
	 * Fetch external data, if needed.
	 *
	 * @param {Object} geoJSON to expand
	 * @return {Promise<Object>} Expanded GeoJSON including external data
	 * @private
	 */
	function fetchExternalData( geoJSON ) {
		if ( !externalDataParser.isExternalData( geoJSON ) ) {
			return createResolvedPromise( geoJSON );
		}
		return externalDataLoader.fetch( geoJSON )
			.then( function ( externalData ) {
				return externalDataParser.parse( geoJSON, externalData );
			} );
	}

	/**
	 * Fetch all mapdata and contained ExternalData for a list of group ids.
	 * Note that unused groups not included in groupIds will not be fetched.
	 *
	 * @param {string[]|string} groupIds List of group ids to load (will coerce
	 * from a string if needed).
	 * @param {string} [title] Will be ignored when revid is supplied
	 * @param {string|false} [revid] Either title or revid must be set.
	 * If false or missing, falls back to a title-only request.
	 * @param {string|false} [lang] Language, used for variants
	 * @return {Promise<Group[]>} Resolves with a list of expanded Group objects.
	 * @public
	 */
	function loadGroups( groupIds, title, revid, lang ) {
		groupIds = toArray( groupIds );
		// Fetch mapdata from MediaWiki.
		return dataLoader.fetchGroups(
			groupIds,
			title,
			revid,
			lang
		).then( function ( mapdata ) {
			return groupIds.map( function ( id ) {
				var groupData = mapdata[ id ];

				// Handle failed groups by replacing an error in its place.
				if ( !groupData ) {
					var group = new Group();
					group.name = id;
					group.fail( new Error( 'Received empty response for group "' + id + '"' ) );
					return group;
				}

				return loadExternalData( groupData, id );
			} );
		} ).then(
			wrappers.whenAllPromises
		).then( function ( groupLists ) {
			// Flatten
			return [].concat.apply( [], groupLists );
		} );
	}

	return {
		loadExternalData: loadExternalData,
		loadGroups: loadGroups
	};
};
