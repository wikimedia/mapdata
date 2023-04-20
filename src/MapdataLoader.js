/**
 * Factory function returning an instance.
 *
 * @param {Function} extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} createResolvedPromise
 * @param {Function} mwApi Reference to {@see mw.Api.get}
 * @param {Object} [clientStore] External cache for groups, supplied by the caller.
 * @return {Kartographer.Data.MapdataLoader}
 */
module.exports = function (
	extend,
	createResolvedPromise,
	mwApi,
	clientStore
) {
	clientStore = clientStore || {};

	/**
	 * Fetches GeoJSON content for a mapframe or maplink tag from the Kartographer MediaWiki API
	 *
	 * @class Kartographer.Data.MapdataLoader
	 * @constructor
	 */
	var MapdataLoader = function () {};

	/**
	 * @param {string[]} groupIds
	 * @param {string} [title] Will be ignored if revid is supplied.
	 * @param {string|false} [revid] Either title or revid must be set. If false
	 * or missing, falls back to a title-only request.
	 * @param {string|false} [lang] Language, used for variants
	 * @return {Promise<Object>} Resolves to the returned mapdata, or rejects.
	 */
	MapdataLoader.prototype.fetchGroups = function ( groupIds, title, revid, lang ) {
		if ( !groupIds.length ) {
			return createResolvedPromise( {} );
		}
		var cachedResults = {};
		var fetchGroups = [];
		groupIds.forEach( function ( groupId ) {
			if ( clientStore[ groupId ] ) {
				cachedResults[ groupId ] = clientStore[ groupId ];
			} else {
				fetchGroups.push( groupId );
			}
		} );
		if ( fetchGroups.length === 0 ) {
			return createResolvedPromise( cachedResults );
		}

		var params = {
			action: 'query',
			formatversion: '2',
			titles: title,
			revids: revid,
			prop: 'mapdata',
			mpdlimit: 'max',
			mpdgroups: fetchGroups
		};
		delete params[ revid ? 'titles' : 'revids' ];
		if ( lang ) {
			params.uselang = lang;
		}

		return mwApi( params ).then( function ( data ) {
			if ( data && data.error ) {
				throw new Error( 'Mapdata error: ' + ( data.error.info || data.error.code ) );
			}
			if ( !data || !data.query || !data.query.pages ||
				!data.query.pages[ 0 ] || !data.query.pages[ 0 ].mapdata
			) {
				throw new Error( 'Invalid mapdata response for ' + JSON.stringify( params ) );
			}
			return extend( cachedResults, JSON.parse( data.query.pages[ 0 ].mapdata ) );
		} );
	};

	return new MapdataLoader();
};
