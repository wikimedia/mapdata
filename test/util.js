'use strict';

const _ = require( 'underscore' );
const createPromise = ( fn ) => new Promise( fn );
const createResolvedPromise = ( value ) => Promise.resolve( value );
const extend = ( target, ...sources ) => {
	for ( const i in sources ) {
		for ( const key in sources[ i ] ) {
			target[ key ] = sources[ i ][ key ];
		}
	}
	return target;
};
const isEmptyObject = ( obj ) => !Object.keys( obj ).length;
const isPlainObject = _.isObject;
const whenAllPromises = Promise.all.bind( Promise );

module.exports = {
	createPromise,
	createResolvedPromise,
	extend,
	isEmptyObject,
	isPlainObject,
	whenAllPromises
};
