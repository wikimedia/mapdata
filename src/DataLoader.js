/**
 * @class Kartographer.Data.DataLoader
 * @param {Function} createPromise
 * @param {Function} createResolvedPromise
 * @param {Function} mwApi Reference to the {@see mw.Api} constructor
 * @param {Object} [clientStore]
 * @param {string} [title] Will be ignored if revid is supplied.
 * @param {string|false} [revid] Either title or revid must be set. If false or missing, falls back
 *  to a title-only request.
 * @param {Function} [debounce] Reference to e.g. {@see jQuery.debounce}
 * @param {Function} [log]
 * @constructor
 */
module.exports = function (
	createPromise,
	createResolvedPromise,
	mwApi,
	clientStore,
	title,
	revid,
	debounce,
	log
) {
	var DataLoader = function () {
		/**
		 * @type {Object.<string,Promise>} Hash of group ids and associated promises
		 * @private
		 */
		this.promiseByGroup = {};

		/**
		 * @type {string[]} List of group ids to fetch next time {@link #fetch} is called
		 * @private
		 */
		this.nextFetch = [];

		if ( debounce ) {
			this.fetch = debounce( 100, this.fetch.bind( this ) );
		}
	};

	clientStore = clientStore || {};

	/**
	 * @param {string} groupId
	 * @return {Promise}
	 */
	DataLoader.prototype.fetchGroup = function ( groupId ) {
		var promise = this.promiseByGroup[ groupId ],
			resolveFunc, rejectFunc;
		if ( !promise ) {
			if ( clientStore[ groupId ] ) {
				promise = createResolvedPromise( clientStore[ groupId ] );
			} else {
				// FIXME: this is a horrible hack
				// The resolve and reject functions are attached to the promise object's instance
				// so that they can be called from the fetch function later
				this.nextFetch.push( groupId );
				promise = createPromise( function ( resolve, reject ) {
					resolveFunc = resolve;
					rejectFunc = reject;
				} );
				promise.mwResolve = resolveFunc;
				promise.mwReject = rejectFunc;
			}

			this.promiseByGroup[ groupId ] = promise;
		}
		return promise;
	};

	/**
	 * @return {Promise}
	 */
	DataLoader.prototype.fetch = function () {
		var loader = this,
			groupsToLoad = loader.nextFetch;

		if ( !groupsToLoad.length ) {
			return createResolvedPromise();
		}

		loader.nextFetch = [];

		/**
		 * FIXME: we need to fix this horrid hack
		 * http://stackoverflow.com/questions/39970101/combine-multiple-debounce-promises-in-js
		 *
		 * @param {string[]} groupsToLoad
		 * @param {Object.<string,Object>} values Map of group id to GeoJSON
		 * @param {Object} [err] MediaWiki API error
		 */
		function setPromises( groupsToLoad, values, err ) {
			for ( var i = 0; i < groupsToLoad.length; i++ ) {
				var promise = loader.promiseByGroup[ groupsToLoad[ i ] ];
				if ( promise.mwResolve ) {
					if ( err ) {
						promise.mwReject( err );
					} else {
						promise.mwResolve( values[ groupsToLoad[ i ] ] || {} );
					}
					delete promise.mwResolve;
					delete promise.mwReject;
				}
			}
		}

		var params = {
			action: 'query',
			formatversion: '2',
			titles: title,
			revids: revid,
			prop: 'mapdata',
			mpdlimit: 'max',
			mpdgroups: groupsToLoad.join( '|' )
		};
		delete params[ revid ? 'titles' : 'revids' ];

		return mwApi( params ).then( function ( data ) {
			if ( !data.query || !data.query.pages || !data.query.pages[ 0 ] ) {
				if ( log ) {
					log( 'warn', 'DataLoader retrieved incomplete results: ' + JSON.stringify( data ) );
				}
				setPromises( groupsToLoad, {} );
			} else {
				var rawMapData = data.query.pages[ 0 ].mapdata;
				setPromises( groupsToLoad, rawMapData && JSON.parse( rawMapData ) || {} );
			}
		}, function ( err ) {
			if ( log ) {
				log( 'error', 'DataLoader request failed: ' + err.message + err.stack );
			}
			setPromises( groupsToLoad, undefined, err );
		} );
	};

	return new DataLoader();
};
