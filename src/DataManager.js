/* globals module */
/**
 * Data Manager.
 *
 * @class Kartographer.Data.DataManager
 */

module.exports = function ( wrappers ) {

  var
    createResolvedPromise = function ( value ) {
      return wrappers.createPromise( function ( resolve ) {
        resolve( value );
      } );
    },
    DataLoader = require( './DataLoader' )(
      wrappers.createPromise,
      createResolvedPromise,
      wrappers.mwApi,
      wrappers.clientStore,
      wrappers.title,
      wrappers.debounce,
      wrappers.bind
    ),
    Group = require( './Group.js' ),
    ExternalGroup = require( './Group.External' )(
      wrappers.extend,
      wrappers.isEmptyObject,
      wrappers.isArray,
      wrappers.getJSON,
      wrappers.mwMsg,
      wrappers.mwUri,
      Group
    ),
    DataStore = require( './DataStore' ),
    HybridGroup = require( './Group.Hybrid' )(
      wrappers.extend,
      createResolvedPromise,
      wrappers.isPlainObject,
      wrappers.isArray,
      wrappers.whenAllPromises,
      Group,
      ExternalGroup,
      DataLoader,
      DataStore
    ),
    InternalGroup = require( './Group.Internal' )(
      wrappers.extend,
      HybridGroup,
      ExternalGroup,
      DataLoader
    ),
    DataManager = function () {};

  /**
   * @param {string[]} groupIds List of group ids to load.
   * @return {Promise}
   */
  DataManager.prototype.loadGroups = function ( groupIds ) {
    var promises = [],
        group,
        i;

    for ( i = 0; i < groupIds.length; i++ ) {
      group = DataStore.get( groupIds[ i ] ) || DataStore.add( new InternalGroup( groupIds[ i ] ) );
      promises.push( group.fetch() );
    }

    DataLoader.fetch();

    return wrappers.whenAllPromises( promises ).then( function () {
      var groupList = [],
          group,
          i;

      for ( i = 0; i < groupIds.length; i++ ) {

        group = DataStore.get( groupIds[ i ] );
        if ( !wrappers.isEmptyObject( group.getGeoJSON() ) ) {
          groupList = groupList.concat( group );
        }
        groupList = groupList.concat( group.externals );
      }

      return groupList;
    } );
  };

  /**
   * @param {Object} geoJSON
   * @return {Promise}
   */
  DataManager.prototype.load = function ( geoJSON ) {
    var group = new HybridGroup( null, geoJSON );

    return group.load().then( function () {
      var groupList = [];

      if ( !wrappers.isEmptyObject( group.getGeoJSON() ) ) {
        groupList = groupList.concat( group );
      }

      return groupList.concat( group.externals );
    } );
  };

  return new DataManager();
};
