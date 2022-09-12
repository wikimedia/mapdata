'use strict';

const hybridGroupLib = require( '../src/Group.Hybrid' );
const Group = require( '../src/Group.js' );

const extend = ( target, ...sources ) => {
	for ( const i in sources ) {
		for ( const key in sources[ i ] ) {
			target[ key ] = sources[ i ][ key ];
		}
	}
	return target;
};

describe( 'HybridGroup', function () {
	test( 'basic functionality', () => {
		const id = '_example',
			geoJSON = { id },
			options = { attribution: 'Example attribution' };

		const HybridGroup = hybridGroupLib(
			extend,
			undefined,
			undefined,
			undefined,
			Group
		);
		const hybridGroup = new HybridGroup( id, geoJSON, options );

		expect( hybridGroup.id ).toBe( id );
		expect( hybridGroup.getGeoJSON() ).toBe( geoJSON );
		expect( hybridGroup.getAttribution() ).toBe( 'Example attribution' );
		expect( hybridGroup ).toHaveProperty( 'load' );
		expect( hybridGroup ).toHaveProperty( 'fetchExternalGroups' );
		expect( hybridGroup ).toHaveProperty( 'parse' );

		// TODO: Test actual business logic
	} );
} );
