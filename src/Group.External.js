/**
 * @class Kartographer.Data.Group.External
 * @extends Kartographer.Data.Group
 *
 * All parameters are dependency injections and should be removed in the future, see T322722.
 *
 * @param {Function} extend Reference to e.g. {@see jQuery.extend}
 * @param {Function} isEmptyObject Reference to e.g. {@see jQuery.isEmptyObject}
 * @param {Function} getJSON Reference to e.g. {@see jQuery.getJSON}
 * @param {Function} [mwMsg] Reference to the {@see mw.msg} function
 * @param {Function} mwUri Reference to the {@see mw.Uri} constructor
 * @param {Function} mwHtmlElement Reference to the {@see mw.html.element} function
 * @param {Function} Group Reference to the {@see Kartographer.Data.Group} class
 * @param {Function} [log]
 * @return {Function}
 */
module.exports = function (
	extend,
	isEmptyObject,
	getJSON,
	mwMsg,
	mwUri,
	mwHtmlElement,
	Group,
	log
) {

	var ExternalGroup = function () {
		Group.prototype.constructor.apply( this, arguments );

		this.isExternal = true;
	};

	extend( ExternalGroup.prototype, Group.prototype );

	/**
	 * @return {Promise}
	 */
	ExternalGroup.prototype.fetch = function () {
		var group = this,
			data = group.geoJSON;

		if ( group.promise ) {
			return group.promise;
		}

		if ( !data.url ) {
			throw new Error( 'ExternalData has no url' );
		}

		group.promise = getJSON( data.url ).then( function ( geodata ) {
			var baseProps = data.properties,
				geometry,
				coordinates,
				i, j;

			switch ( data.service ) {

				case 'page':
					if ( geodata.jsondata && geodata.jsondata.data ) {
						extend( data, geodata.jsondata.data );
					}
					// FIXME: error reporting, at least to console.log
					break;

				case 'geomask':
					// Mask-out the entire world 10 times east and west,
					// and add each result geometry as a hole
					coordinates = [ [
						[ 3600, -180 ],
						[ 3600, 180 ],
						[ -3600, 180 ],
						[ -3600, -180 ],
						[ 3600, -180 ]
					] ];
					for ( i = 0; i < geodata.features.length; i++ ) {
						geometry = geodata.features[ i ].geometry;
						if ( !geometry ) {
							continue;
						}
						// Only add the very first (outer) polygon
						switch ( geometry.type ) {
							case 'Polygon':
								coordinates.push( geometry.coordinates[ 0 ] );
								break;
							case 'MultiPolygon':
								for ( j = 0; j < geometry.coordinates.length; j++ ) {
									coordinates.push( geometry.coordinates[ j ][ 0 ] );
								}
								break;
						}
					}
					data.type = 'Feature';
					data.geometry = {
						type: 'Polygon',
						coordinates: coordinates
					};
					break;

				case 'geoshape':
				case 'geopoint':
				case 'geoline':

					// HACK: workaround for T144777 - we should be using topojson instead
					extend( data, geodata );

					// data.type = 'FeatureCollection';
					// data.features = [];
					// $.each( geodata.objects, function ( key ) {
					// data.features.push( topojson.feature( geodata, geodata.objects[ key ] ) );
					// } );

					// Each feature returned from geoshape service may contain "properties"
					// If externalData element has properties, merge with properties in the feature
					if ( baseProps ) {
						for ( i = 0; i < data.features.length; i++ ) {
							if ( isEmptyObject( data.features[ i ].properties ) ) {
								data.features[ i ].properties = baseProps;
							} else {
								data.features[ i ].properties = extend( {}, baseProps,
									data.features[ i ].properties );
							}
						}
					}
					break;

				default:
					throw new Error( 'Unknown externalData service ' + data.service );
			}

			if ( mwMsg ) {
				group.parseAttribution();
			}
		}, function () {
			if ( log ) {
				log( 'warn', 'ExternalGroup getJSON failed: ' + JSON.stringify( arguments ) );
			}
			group.failed = true;
		} );

		return group.promise;
	};

	ExternalGroup.prototype.parseAttribution = function () {
		var group = this,
			links = [],
			uri = mwUri( group.geoJSON.url );

		if ( group.geoJSON.service === 'page' ) {
			links.push(
				mwHtmlElement( 'a',
					{
						target: '_blank',
						href: '//commons.wikimedia.org/wiki/Data:' + encodeURIComponent( uri.query.title )
					},
					uri.query.title
				)
			);
			group.attribution = mwMsg(
				'kartographer-attribution-externaldata',
				mwMsg( 'project-localized-name-commonswiki' ),
				links
			);
		}
	};

	return ExternalGroup;
};
