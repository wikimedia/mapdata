'use strict';

const dataManagerLib = require( '../src/DataManager' );

const extend = ( target, ...sources ) => {
	for ( const i in sources ) {
		for ( const key in sources[ i ] ) {
			target[ key ] = sources[ i ][ key ];
		}
	}
	return target;
};

describe( 'DataManager', function () {
	test( 'basic functionality', () => {
		const dataManager = dataManagerLib( {
			extend
		} );

		expect( dataManager ).toHaveProperty( 'loadGroups' );
		expect( dataManager ).toHaveProperty( 'load' );

		// TODO: Test actual business logic
	} );
} );
