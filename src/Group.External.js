/* globals module */
/**
 * External Data Group.
 *
 * @class Kartographer.Data.Group.External
 * @extends Kartographer.Data.Group
 */
module.exports = function ( extend, isEmptyObject, isArray, getJSON, mwMsg, mwUri, Group ) {

  var ExternalGroup = function () {
    // call the constructor
    this.initialize.apply( this, arguments );
    this.isExternal = true;
  };

  extend( ExternalGroup.prototype, Group.prototype );

  ExternalGroup.prototype.initialize = function ( groupId, geoJSON, options ) {
    options = options || {};

    Group.prototype.initialize.call( this, groupId, geoJSON, options );
  };

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
          coordinates = [ [ [ 3600, -180 ], [ 3600, 180 ], [ -3600, 180 ], [ -3600, -180 ], [ 3600, -180 ] ] ];
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
        case 'geoline':

          // HACK: workaround for T144777 - we should be using topojson instead
          extend( data, geodata );

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
          break;

        default:
          throw new Error( 'Unknown externalData service ' + data.service );
      }

      if ( mwMsg ) {
        group.parseAttribution();
      }
    }, function () {
      group.failed = true;
    } );

    return group.promise;
  };

  ExternalGroup.prototype.parseAttribution = function () {
    var i,
        group = this,
        ids = [],
        links = [],
        uri = mwUri( group.geoJSON.url );

    switch ( group.geoJSON.service ) {
      case 'page':
        // FIXME: add link to commons page
        break;

      case 'geoshape':
      case 'geoline':
        if ( uri.query.query ) {
          links.push( '<a target="_blank" href="//query.wikidata.org/#' +
              encodeURI( uri.query.query ) +
              '">' +
              mwMsg( 'kartographer-attribution-externaldata-query' ) +
              '</a>' );
        }

        if ( uri.query.ids ) {
          ids = uri.query.ids.split( ',' );

          for ( i = 0; i < ids.length; i++ ) {
            links.push( '<a target="_blank" href="//www.wikidata.org/wiki/' +
                encodeURI( ids[ i ] ) +
                '">' +
                encodeURI( ids[ i ] ) +
                '</a>' );
          }
        }
        group.attribution = mwMsg(
            'kartographer-attribution-externaldata',
            mwMsg( 'project-localized-name-wikidatawiki' ),
            links
        );
        break;
    }
  };

  return ExternalGroup;
};
