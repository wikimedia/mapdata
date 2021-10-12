/**
 * @class Kartographer.Data.DataLoader
 * @param {Function} createPromise
 * @param {Function} createResolvedPromise
 * @param {Function} mwApi
 * @param {Object} [clientStore]
 * @param {string} [title] Will be ignored if revid is supplied.
 * @param {string|boolean} [revid] Either title or revid must be set.  If false,
 *     falls back to a title-only request.
 * @param {Function} [debounce]
 * @constructor
 */
module.exports = function ( createPromise, createResolvedPromise, mwApi, clientStore, title, revid, debounce ) {

	var DataLoader = function () {
		/**
		 * @type {Object} Hash of group ids and associated promises.
		 * @private
		 */
		this.promiseByGroup = {};
		/**
		 * @type {string[]} List of group ids to fetch next time
		 *   {@link #fetch} is called.
		 *
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
			groupsToLoad = loader.nextFetch,
			params;

		if ( !groupsToLoad.length ) {
			return createResolvedPromise();
		}

		loader.nextFetch = [];

		// FIXME: we need to fix this horrid hack
		// http://stackoverflow.com/questions/39970101/combine-multiple-debounce-promises-in-js
		function setPromises( groupsToLoad, values, err ) {
			var i, promise;

			for ( i = 0; i < groupsToLoad.length; i++ ) {
				promise = loader.promiseByGroup[ groupsToLoad[ i ] ];
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

		params = {
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
			var rawMapData = data.query.pages[ 0 ].mapdata;
			setPromises( groupsToLoad, rawMapData && JSON.parse( rawMapData ) || {} );
		}, function ( err ) {
			setPromises( groupsToLoad, undefined, err );
		} );
	};

	return new DataLoader();
};
