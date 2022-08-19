'use strict';

const Group = require( '../src/Group.js' );
const externalGroupLib = require( '../src/Group.External' );

const isEmptyObject = ( obj ) => !Object.keys( obj ).length;
const extend = ( target, ...sources ) => {
	for ( let i in sources ) {
		for ( const key in sources[ i ] ) {
			target[ key ] = sources[ i ][ key ];
		}
	}
	return target;
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
		const geodata = {
			features: [
				{ properties: {} },
				{ properties: { baseProperty: 'fromFeature' } },
				{ properties: { featureProperty: true } }
			]
		};
		const getJSON = () => { return { then: ( fn ) => fn( geodata ) }; };
		const ExternalGroup = externalGroupLib(
			extend,
			isEmptyObject,
			getJSON,
			undefined,
			undefined,
			undefined,
			Group
		);

		const group = new ExternalGroup( '', geoJSON );
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
} );
