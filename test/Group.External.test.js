'use strict';

const Group = require( '../src/Group.js' );
const externalGroupLib = require( '../src/Group.External' );
const { extend, isEmptyObject } = require( './util' );

const createExternalGroup = ( geoJSON, fetchedGeodata ) => {
	const getJSON = () => ( { then: ( fn ) => fn( fetchedGeodata ) } );
	const ExternalGroup = externalGroupLib(
		extend,
		isEmptyObject,
		getJSON,
		undefined,
		undefined,
		undefined,
		Group
	);
	return new ExternalGroup( '', geoJSON );
};

describe( 'ExternalGroup', function () {
	const services = [
		'geoline',
		'geopoint',
		'geoshape'
	];
	it.each( services )( 'basic service supported', ( service ) => {
		const geoJSON = {
			url: '/',
			service,
			properties: { baseProperty: 'fromBase' }
		};
		const fetchedGeodata = {
			features: [
				{ properties: {} },
				{ properties: { baseProperty: 'fromFeature' } },
				{ properties: { featureProperty: true } }
			]
		};
		const group = createExternalGroup( geoJSON, fetchedGeodata );
		group.fetch();

		expect( group.failed ).not.toBe( true );
		expect( group.geoJSON ).toHaveProperty( 'features' );

		expect( group.geoJSON.features[ 0 ].properties ).toHaveProperty( 'baseProperty' );
		expect( group.geoJSON.features[ 1 ].properties ).toHaveProperty( 'baseProperty' );
		expect( group.geoJSON.features[ 2 ].properties ).toHaveProperty( 'baseProperty' );
		expect( group.geoJSON.features[ 2 ].properties ).toHaveProperty( 'featureProperty' );

		expect( group.geoJSON.features[ 0 ].properties.baseProperty ).toBe( 'fromBase' );
		expect( group.geoJSON.features[ 1 ].properties.baseProperty ).toBe( 'fromFeature' );
	} );

	test( 'bubbles errors up', () => {
		const group = createExternalGroup( {}, { features: {} } );
		expect( () => group.fetch() )
			.toThrow( 'ExternalData has no url' );
		expect( group.geoJSON ).not.toHaveProperty( 'features' );
	} );
} );
