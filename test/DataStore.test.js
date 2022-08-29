'use strict';

const dataStoreLib = require( '../src/DataStore' );

describe( 'DataStore', function () {
	test( 'basic functionality', () => {
		const datastore = dataStoreLib(),
			id = '_example',
			group = { id };

		expect( datastore.has( id ) ).toBe( false );
		expect( datastore.get( id ) ).toBeUndefined();
		expect( datastore.add( group ) ).toBe( group );
		expect( datastore.has( id ) ).toBe( true );
		expect( datastore.get( id ) ).toBe( group );
	} );
} );
