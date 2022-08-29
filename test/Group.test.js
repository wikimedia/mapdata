'use strict';

const Group = require( '../src/Group' );

describe( 'Group', function () {
	test( 'basic functionality', () => {
		const id = '_example',
			geoJSON = { id },
			options = { attribution: 'Example attribution' };

		const group = new Group( id, geoJSON, options );

		expect( group.id ).toBe( id );
		expect( group.getGeoJSON() ).toBe( geoJSON );
		expect( group.getAttribution() ).toBe( 'Example attribution' );
	} );
} );
