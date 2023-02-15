/**
 * Factory function returning an instance.
 *
 * @param {Function} isPlainObject
 * @param {Function} isEmptyObject
 * @param {Function} extend
 * @return {Object}
 */
module.exports = function (
	isPlainObject,
	isEmptyObject,
	extend
) {

	/**
	 * @param {Object|null} geoJSON
	 * @return {boolean} True if this is an ExternalData
	 * @public
	 */
	function isExternalData( geoJSON ) {
		return isPlainObject( geoJSON ) &&
			geoJSON.type === 'ExternalData';
	}

	/**
	 * Transform returned GeoJSON depending on the type of ExternalData.
	 *
	 * FIXME: Wouldn't this be a job for the mapdata API?
	 *
	 * @param {Object} geoJSON (modified in-place)
	 * @param {Object} externalData fetched ExternalData blob
	 * @return {Object} Expanded geoJSON
	 * @public
	 */
	function parse( geoJSON, externalData ) {
		var baseProps = geoJSON.properties,
			geometry,
			coordinates,
			i, j;

		switch ( geoJSON.service ) {

			case 'page':
				extend( geoJSON, externalData.jsondata.data );
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
				for ( i = 0; i < externalData.features.length; i++ ) {
					geometry = externalData.features[ i ].geometry;
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
				geoJSON.type = 'Feature';
				geoJSON.geometry = {
					type: 'Polygon',
					coordinates: coordinates
				};
				break;

			case 'geoshape':
			case 'geopoint':
			case 'geoline':

				// HACK: workaround for T144777 - we should be using topojson instead
				extend( geoJSON, externalData );

				// geoJSON.type = 'FeatureCollection';
				// geoJSON.features = [];
				// $.each( externalData.objects, function ( key ) {
				// geoJSON.features.push( topojson.feature( externalData, externalData.objects[ key ] ) );
				// } );

				// Each feature returned from geoshape service may contain "properties"
				// If externalData element has properties, merge with properties in the feature
				if ( baseProps ) {
					for ( i = 0; i < geoJSON.features.length; i++ ) {
						if ( isEmptyObject( geoJSON.features[ i ].properties ) ) {
							geoJSON.features[ i ].properties = baseProps;
						} else {
							geoJSON.features[ i ].properties = extend( {}, baseProps,
								geoJSON.features[ i ].properties );
						}
					}
				}
				break;

			default:
				throw new Error( 'Unknown externalData service "' + geoJSON.service + '"' );
		}

		return geoJSON;
	}

	return {
		isExternalData: isExternalData,
		parse: parse
	};
};
