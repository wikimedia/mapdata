/* globals module */
/**
 * Internal Data Group.
 *
 * @class Kartographer.Data.Group.Internal
 * @extends Kartographer.Data.Group.HybridGroup
 */
module.exports = function ( extend, HybridGroup, ExternalGroup, DataLoader ) {

  var InternalGroup = function () {
    // call the constructor
    this.initialize.apply( this, arguments );
  };

  extend( InternalGroup.prototype, HybridGroup.prototype );

  /**
   * @return {Promise}
   */
  InternalGroup.prototype.fetch = function () {
    var group = this;

    if ( group.promise ) {
      return group.promise;
    }

    group.promise = DataLoader.fetchGroup( group.id ).then( function ( apiGeoJSON ) {
      return group.parse( apiGeoJSON ).then( function ( group ) {
        return group.fetchExternalGroups();
      } );
    } );
    return group.promise;
  };
  return InternalGroup;
};
