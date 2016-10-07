/* globals module */
/**
 * Data loader.
 *
 * @class Kartographer.Data.DataLoader
 */
module.exports = function ( createPromise, mwApi, clientStore, title, debounce, bind ) {

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
	 * @return {jQuery.Promise}
	 */
	DataLoader.prototype.fetchGroup = function ( groupId ) {
		var promise = this.promiseByGroup[ groupId ];
		if ( !promise ) {
			promise = this.promiseByGroup[ groupId ] = createPromise();

			if ( clientStore[ groupId ] ) {
				promise.resolve( clientStore[ groupId ] );
			} else {
				this.nextFetch.push( groupId );
			}
		}
		return promise;
	};

	/**
	 * @return {jQuery.Promise}
	 */
	DataLoader.prototype.fetch = function () {
		var groupsToLoad = this.nextFetch,
			loader = this,
			deferred = createPromise();

		this.nextFetch = [];

		if ( groupsToLoad.length ) {
			mwApi( 'get', {
				action: 'query',
				formatversion: '2',
				titles: title,
				prop: 'mapdata',
				mpdgroups: groupsToLoad.join( '|' )
			} ).then( function ( data ) {
				var rawMapData = data.query.pages[ 0 ].mapdata,
					i;

				rawMapData = rawMapData && JSON.parse( rawMapData ) || {};

				for ( i = 0; i < groupsToLoad.length; i++ ) {
					loader.promiseByGroup[ groupsToLoad[ i ] ].resolve( rawMapData[ groupsToLoad[ i ] ] );
				}
				deferred.resolve();
			} );
		}
		return deferred;
	};

	return new DataLoader();
};
