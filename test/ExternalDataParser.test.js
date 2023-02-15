'use strict';

const { isPlainObject, isEmptyObject, extend } = require( './util' );
const externalDataParserLib = require( '../src/ExternalDataParser' );

describe( 'ExternalDataParser isExternalData', () => {
	const parser = externalDataParserLib( isPlainObject );

	[
		{
			name: 'garbage',
			input: null,
			output: false
		},
		{
			name: 'with no type',
			input: { foo: 'bar' },
			output: false
		},
		{
			name: 'other type',
			input: { type: 'Feature' },
			output: false
		},
		{
			name: 'ExternalData',
			input: { type: 'ExternalData' },
			output: true
		}
	].forEach( ( { name, input, output } ) => {
		test( name, () => {
			expect( !!parser.isExternalData( input ) ).toBe( output );
		} );
	} );
} );

describe( 'ExternalDataParser parse handles', () => {
	const parser = externalDataParserLib(
		isPlainObject,
		isEmptyObject,
		extend
	);

	test( 'page service with returned data', () => {
		const group = {
			service: 'page'
		};
		const geodata = {
			jsondata: {
				data: {
					type: 'Feature'
				}
			}
		};
		const parsed = parser.parse( group, geodata );
		expect( parsed ).toStrictEqual( {
			service: 'page',
			type: 'Feature'
		} );
	} );

	test( 'page service with no data returned', () => {
		const group = {
			service: 'page'
		};
		expect( () => parser.parse( group, undefined ) ).toThrow( 'Cannot read propert' );
	} );

	test( 'geomask is transformed', () => {
		const group = {
			service: 'geomask'
		};
		const geodata = {
			type: 'FeatureCollection',
			features: [ {
				geometry: {
					type: 'Polygon',
					coordinates: [ [ [ 0, 1 ], [ 2, 3 ] ] ]
				}
			} ]
		};
		const parsed = parser.parse( group, geodata );
		expect( parsed ).toStrictEqual( {
			service: 'geomask',
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [ [
					[ 3600, -180 ],
					[ 3600, 180 ],
					[ -3600, 180 ],
					[ -3600, -180 ],
					[ 3600, -180 ]
				], [
					[ 0, 1 ],
					[ 2, 3 ]
				] ]
			}
		} );
	} );

	test( 'geoshape merges properties', () => {
		const group = {
			service: 'geoshape',
			properties: { fill: '#abc' }
		};
		const geodata = {
			type: 'FeatureCollection',
			features: [
				{ properties: { fill: '#def' } },
				{ properties: { stroke: '#321' } }
			]
		};
		const parsed = parser.parse( group, geodata );
		expect( parsed ).toStrictEqual( {
			service: 'geoshape',
			type: 'FeatureCollection',
			properties: { fill: '#abc' },
			features: [
				{ properties: { fill: '#def' } },
				{ properties: { fill: '#abc', stroke: '#321' } }
			]
		} );
	} );
} );
