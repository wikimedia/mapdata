'use strict';

const { extend } = require( './util' );
const dataManagerLib = require( '../src/DataManager' );

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
