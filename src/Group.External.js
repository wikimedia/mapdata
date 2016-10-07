/* globals module */
/**
 * External Data Group.
 *
 * @class Kartographer.Data.Group.External
 * @extends Kartographer.Data.Group
 */
module.exports = ( function ( extend, createPromise, isEmptyObject, isArray, getJSON, mwMsg, mwUri, Group ) {

	var ExternalGroup = function () {
		// call the constructor
		this.initialize.apply( this, arguments );
	};

	extend( ExternalGroup.prototype, Group.prototype );

	ExternalGroup.prototype.initialize = function ( groupId, geoJSON, options ) {
		options = options || {};

		Group.prototype.initialize.call( this, groupId, geoJSON, options );
		this.isExternal = true;
	};

	/**
	 * @return {jQuery.Promise}
	 */
	ExternalGroup.prototype.fetch = function () {
		var uri, deferred,
			group = this,
			data = group.geoJSON;

		if ( group.promise ) {
			return group.promise;
		}

		group.promise = deferred = createPromise();

		if ( data.href ) {
			uri = mwUri( data.href );
			// If url begins with   protocol:///...  mark it as having relative host
			if ( /^[a-z]+:\/\/\//.test( data.href ) ) {
				uri.isRelativeHost = true;
			}
		} else if ( data.service ) {
			// Construct URI out of the parameters in the externalData object
			uri = mwUri( {
				protocol: data.service,
				host: data.host,
				path: '/'
			} );
			uri.isRelativeHost = !data.host;
			uri.query = {};
			switch ( data.service ) {
				case 'geoshape':
				case 'geoline':
					if ( data.query ) {
						if ( typeof data.query === 'string' ) {
							uri.query.query = data.query;
						} else {
							throw new Error( 'Invalid "query" parameter in ExternalData' );
						}
					}
					if ( data.ids ) {
						if ( isArray( data.ids ) ) {
							uri.query.ids = data.ids.join( ',' );
						} else if ( typeof data.ids === 'string' ) {
							uri.query.ids = data.ids.replace( /\s*,\s*/, ',' );
						} else {
							throw new Error( 'Invalid "ids" parameter in ExternalData' );
						}
					}
					break;
				default:
					throw new Error( 'Unknown externalData protocol ' + data.service );
			}
		}

		switch ( uri.protocol ) {
			case 'geoshape':
			case 'geoline':

				// geoshape:///?ids=Q16,Q30
				// geoshape:///?query=SELECT...
				// Get geo shapes data from OSM database by supplying Wikidata IDs or query
				// https://maps.wikimedia.org/geoshape?ids=Q16,Q30
				if ( !uri.query || ( !uri.query.ids && !uri.query.query ) ) {
					throw new Error( uri.protocol + ': missing ids or query parameter in externalData' );
				}
				if ( !uri.isRelativeHost && uri.host !== 'maps.wikimedia.org' ) {
					throw new Error( uri.protocol + ': hostname must be missing or "maps.wikimedia.org"' );
				}
				uri.host = 'maps.wikimedia.org';
				uri.port = undefined;
				uri.path = '/' + uri.protocol;
				uri.protocol = 'https';
				uri.query.origin = location.protocol + '//' + location.host;
				// HACK: workaround for T144777
				uri.query.getgeojson = 1;

				getJSON( uri.toString() ).then( function ( geodata ) {
					var baseProps = data.properties,
						ids = [],
						i,
						links = [];
					delete data.href;

					// HACK: workaround for T144777 - we should be using topojson instead
					extend( group.geoJSON, geodata );

					if ( mwMsg ) {
						if ( uri.query.query ) {
							links.push( '<a target="_blank" href="//query.wikidata.org/#' + encodeURI( uri.query.query ) + '">' + mwMsg( 'kartographer-attribution-externaldata-query' ) + '</a>' );
						} else {
							ids = uri.query.ids.split( ',' );

							for ( i = 0; i < ids.length; i++ ) {
								links.push( '<a target="_blank" href="//www.wikidata.org/wiki/' + encodeURI( ids[ i ] ) + '">' + encodeURI( ids[ i ] ) + '</a>' );
							}
						}
						group.attribution = mwMsg(
							'kartographer-attribution-externaldata',
							mwMsg( 'project-localized-name-wikidatawiki' ),
							links
						);
					}

					// console.log( 'data', data );

					// data.type = 'FeatureCollection';
					// data.features = [];
					// $.each( geodata.objects, function ( key ) {
					// 	data.features.push( topojson.feature( geodata, geodata.objects[ key ] ) );
					// } );

					// Each feature returned from geoshape service may contain "properties"
					// If externalData element has properties, merge it with properties in the feature
					if ( baseProps ) {
						for ( i = 0; i < data.features.length; i++ ) {
							if ( isEmptyObject( data.features[ i ].properties ) ) {
								data.features[ i ].properties = baseProps;
							} else {
								data.features[ i ].properties = extend( {}, baseProps, data.features[ i ].properties );
							}
						}
					}
					return deferred.resolve();
				} );
				break;
			default:
				throw new Error( 'Unknown externalData protocol ' + uri.protocol );
		}
		return group.promise;
	};

	return ExternalGroup;
} );
