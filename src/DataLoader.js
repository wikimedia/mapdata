/**
 * Data loader.
 *
 * @class Kartographer.Data.DataLoader
 */
// eslint-disable-next-line valid-jsdoc
module.exports = function ( createPromise, createResolvedPromise, mwApi, clientStore, title, debounce, bind ) {

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

		if ( debounce && bind ) {
			this.fetch = debounce( 100, bind( this.fetch, this ) );
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

		return mwApi( {
			action: 'query',
			formatversion: '2',
			titles: title,
			prop: 'mapdata',
			mpdlimit: 'max',
			mpdgroups: groupsToLoad.join( '|' )
		} ).then( function ( data ) {
			var rawMapData = data.query.pages[ 0 ].mapdata;
			setPromises( groupsToLoad, rawMapData && JSON.parse( rawMapData ) || {} );
		}, function ( err ) {
			setPromises( groupsToLoad, undefined, err );
		} );
	};

	return new DataLoader();
};
