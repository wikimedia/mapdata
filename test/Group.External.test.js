'use strict';

const Group = require( '../src/Group.js' );
const externalGroupLib = require( '../src/Group.External' );
const { extend, isPlainObject, isEmptyObject } = require( './util' );
const ExternalDataParser = require( '../src/ExternalDataParser' );

const createExternalGroup = ( geoJSON, fetchedGeodata ) => {
	const getJSON = () => ( { then: ( fn ) => fn( fetchedGeodata ) } );
	const externalDataParser = ExternalDataParser(
		isPlainObject,
		isEmptyObject,
		extend
	);
	const ExternalGroup = externalGroupLib(
		extend,
		getJSON,
		Group,
		externalDataParser
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

		expect( group.failed ).toBe( false );
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
