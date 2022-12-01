/**
 * @class Kartographer.Data.ExternalDataParser
 *
 * @param {Function} isPlainObject
 * @param {Function} isEmptyObject
 * @param {Function} extend
 * @constructor
 */
module.exports = function (
	isPlainObject,
	isEmptyObject,
	extend
) {
	var ExternalDataParser = function () {};

	/**
	 * @param {Object|null} geoJSON
	 * @return {boolean} True if this is an ExternalData
	 */
	ExternalDataParser.prototype.isExternalData = function ( geoJSON ) {
		return isPlainObject( geoJSON ) &&
			geoJSON.type === 'ExternalData';
	};

	/**
	 * Transform returned GeoJSON depending on the type of ExternalData.
	 *
	 * FIXME: Wouldn't this be a job for the mapdata API?
	 *
	 * @param {Kartographer.Data.Group} group (modified in-place)
	 * @param {Object} geodata
	 * @return {Kartographer.Data.Group} Expanded group.
	 */
	ExternalDataParser.prototype.parse = function ( group, geodata ) {
		var data = group.getGeoJSON();
		var baseProps = data.properties,
			geometry,
			coordinates,
			i, j;

		switch ( data.service ) {

			case 'page':
				extend( data, geodata.jsondata.data );
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
				throw new Error( 'Unknown externalData service "' + data.service + '"' );
		}

		return group;
	};

	return new ExternalDataParser();
};
