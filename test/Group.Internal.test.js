'use strict';

const { extend } = require( './util' );
const internalGroupLib = require( '../src/Group.Internal' );
const hybridGroupLib = require( '../src/Group.Hybrid' );
const Group = require( '../src/Group' );

describe( 'InternalGroup', function () {
	test( 'basic functionality', () => {
		const id = '_example',
			geoJSON = { id },
			options = { attribution: 'Example attribution' };

		const InternalGroup = internalGroupLib(
			extend,
			hybridGroupLib(
				extend,
				undefined,
				undefined,
				Group
			)
		);
		const internalGroup = new InternalGroup( id, geoJSON, options );

		expect( internalGroup.id ).toBe( id );
		expect( internalGroup.getGeoJSON() ).toBe( geoJSON );
		expect( internalGroup.getAttribution() ).toBe( 'Example attribution' );
		expect( internalGroup ).toHaveProperty( 'fetch' );

		// TODO: Test actual business logic
	} );
} );
