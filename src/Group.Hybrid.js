/* globals module */
/**
 * A hybrid group is a group that is not considered as a {@link Kartographer.Data.Group.HybridGroup}
 * because it does not implement a `fetch` method.
 *
 * This abstraction is useful for the Developer API: the data is passed directly but still needs to
 * be parsed to extract the external sub-groups.
 *
 * @class Kartographer.Data.Group.HybridGroup
 * @extends Kartographer.Data.Group
 */
module.exports = function ( extend, createResolvedPromise, isPlainObject, isArray, whenAllPromises, Group, ExternalGroup, DataLoader, DataStore ) {

  var HybridGroup = function () {
    // call the constructor
    this.initialize.apply( this, arguments );
  };

  function isExternalDataGroup( data ) {
    return isPlainObject( data ) && data.type && data.type === 'ExternalData';
  }

  extend( HybridGroup.prototype, Group.prototype );

  HybridGroup.prototype.initialize = function ( groupId, geoJSON, options ) {
    options = options || {};

    Group.prototype.initialize.call( this, groupId, geoJSON, options );
    this.externals = [];
    this.isExternal = false;
  };

  /**
   * @return {Promise}
   */
  HybridGroup.prototype.load = function () {
    var group = this;

    return group.parse( group.getGeoJSON() ).then( function ( group ) {
      return group.fetchExternalGroups();
    } );
  };

  /**
   * @return {Promise}
   */
  HybridGroup.prototype.fetchExternalGroups = function () {
    var promises = [],
        group = this,
        key,
        externals = group.externals;

    for ( key in externals ) {
      promises.push( externals[ key ].fetch() );
    }

    return whenAllPromises( promises ).then( function () {
      return group;
    } );
  };

  /**
   * @return {Promise}
   */
  HybridGroup.prototype.parse = function ( apiGeoJSON ) {
    var group = this,
        geoJSON,
        externalKey,
        i;

    group.apiGeoJSON = apiGeoJSON;
    apiGeoJSON = JSON.parse( JSON.stringify( apiGeoJSON ) );
    if ( isArray( apiGeoJSON ) ) {
      geoJSON = [];
      for ( i = 0; i < apiGeoJSON.length; i++ ) {
        if ( isExternalDataGroup( apiGeoJSON[ i ] ) ) {
          externalKey = JSON.stringify( apiGeoJSON[ i ] );
          group.externals.push(
            DataStore.get( externalKey ) ||
            DataStore.add( new ExternalGroup( externalKey, apiGeoJSON[ i ] ) )
          );
        } else {
          geoJSON.push( apiGeoJSON[ i ] );
        }
      }
    } else if ( isExternalDataGroup( geoJSON ) ) {
      externalKey = JSON.stringify( geoJSON );
      group.externals.push(
        DataStore.get( externalKey ) ||
        DataStore.add( new ExternalGroup( externalKey, geoJSON ) )
      );
      geoJSON = {};
    }

    group.geoJSON = geoJSON;

    return createResolvedPromise( group );
  };

  return HybridGroup;
};
