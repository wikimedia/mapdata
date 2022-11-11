'use strict';

const hybridGroupLib = require( '../src/Group.Hybrid' );
const Group = require( '../src/Group' );
const { extend, createResolvedPromise, isPlainObject, whenAllPromises } = require( './util' );
const mockExternalDataClass = function ( key, geoJSON ) {
	return { mock: true, key, geoJSON };
};
const dataStoreLib = require( '../src/DataStore' );
const createHybridGroup = ( id, geoJSON, options ) => {
	const HybridGroup = hybridGroupLib(
		extend,
		createResolvedPromise,
		isPlainObject,
		whenAllPromises,
		Group,
		mockExternalDataClass,
		dataStoreLib()
	);
	return new HybridGroup( id, geoJSON, options );
};

describe( 'HybridGroup', function () {
	test( 'basic functionality', () => {
		const id = '_example',
			geoJSON = { id },
			options = { attribution: 'Example attribution' };

		const hybridGroup = createHybridGroup( id, geoJSON, options );

		expect( hybridGroup.id ).toBe( id );
		expect( hybridGroup.getGeoJSON() ).toBe( geoJSON );
		expect( hybridGroup.getAttribution() ).toBe( 'Example attribution' );
		expect( hybridGroup ).toHaveProperty( 'load' );
		expect( hybridGroup ).toHaveProperty( 'fetchExternalGroups' );
		expect( hybridGroup ).toHaveProperty( 'parse' );
	} );

	test( 'parse empty data', async () => {
		const group = createHybridGroup( null, {} );
		await group.parse( {} );

		expect( group.externals ).toStrictEqual( [] );
	} );

	test( 'parse singular external', async () => {
		const geoJSON = {};
		const group = createHybridGroup( null, geoJSON );
		const fetchedGeodata = {
			type: 'ExternalData',
			url: '/',
			service: 'geoshape'
		};
		await group.parse( fetchedGeodata );
		expect( group.externals.length ).toBe( 1 );
		expect( group.externals[ 0 ].mock ).toBe( true );
	} );

	test( 'parse multiple external', async () => {
		const geoJSON = {};
		const group = createHybridGroup( null, geoJSON );
		const fetchedGeodata = [
			{
				type: 'ExternalData',
				url: '/1',
				service: 'geoshape'
			},
			{
				type: 'ExternalData',
				url: '/2',
				service: 'geoshape'
			}
		];
		await group.parse( fetchedGeodata );
		expect( group.externals.length ).toBe( 2 );
		expect( group.externals[ 0 ].geoJSON.url ).toBe( '/1' );
		expect( group.externals[ 1 ].geoJSON.url ).toBe( '/2' );
	} );

	test( 'fetchExternalGroups fetches each group', async () => {
		const geoJSON = {};
		const group = createHybridGroup( null, geoJSON );
		await group.parse( {} );

		const fetch = jest.fn( async () => {} );
		const external = { fetch };
		// Inject a mock group, circumventing the module's interface.
		group.externals = [ external ];
		expect( group.fetchExternalGroups() ).resolves.toBe( group );
		expect( fetch ).toHaveBeenCalled();
	} );

	test( 'fetchExternalGroups bubbles errors up', async () => {
		const geoJSON = {};
		const group = createHybridGroup( null, geoJSON );
		await group.parse( {} );

		const fetch = jest.fn().mockRejectedValue( 'foo' );

		const external = { fetch };
		// Inject a mock group, circumventing the module's interface.
		group.externals = [ external ];
		expect( group.fetchExternalGroups() ).rejects.toBe( 'foo' );
	} );
} );
