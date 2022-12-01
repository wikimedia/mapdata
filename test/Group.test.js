'use strict';

const Group = require( '../src/Group' );

describe( 'Group', function () {
	test( 'named group', () => {
		const geoJSON = { foo: 'bar' };
		const group = new Group( geoJSON );

		expect( group.getGeoJSON() ).toStrictEqual( geoJSON );
	} );

	test( 'ExternalData group', () => {
		const geoJSON = { foo: 'bar' };
		const group = new Group( geoJSON );

		expect( group.getGeoJSON() ).toStrictEqual( geoJSON );
	} );

	test( 'mark failed', () => {
		const group = new Group();
		const err = new Error( 'Foo bar' );
		group.fail( err );
		expect( group.failed ).toBe( true );
		expect( group.failureReason ).toStrictEqual( err );
	} );
} );
