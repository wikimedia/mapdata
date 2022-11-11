'use strict';

const wrappers = require( './util' );
const dataManagerLib = require( '../src/DataManager' );

describe( 'DataManager', function () {
	test( 'basic functionality', async () => {
		const feature = [ {
			type: 'Feature',
			geometry: {
				coordinates: [ 13, 47 ],
				type: 'Point'
			}
		} ];
		const mapdata = { group1: feature };
		const apiResponse = {
			query: {
				pages: [ {
					mapdata: JSON.stringify( mapdata )
				} ]
			}
		};
		const mwApi = jest.fn().mockResolvedValue( apiResponse );
		const dataManager = dataManagerLib( {
			...wrappers,
			mwApi
		} );

		const result = await dataManager.loadGroups( [ 'group1' ] );
		expect( result.length ).toBe( 1 );
		expect( result[ 0 ].getGeoJSON() ).toStrictEqual( feature );
	} );

	test( 'failures are logged and returned', async () => {
		const feature = [ {
			type: 'ExternalData',
			url: null
		} ];
		const mapdata = { group1: feature };
		const apiResponse = {
			query: {
				pages: [ {
					mapdata: JSON.stringify( mapdata )
				} ]
			}
		};
		const log = jest.fn();
		const mwApi = jest.fn().mockResolvedValue( apiResponse );
		const dataManager = dataManagerLib( {
			...wrappers,
			log,
			mwApi
		} );

		const result = await dataManager.loadGroups( [ 'group1' ] );
		expect( log ).toHaveBeenCalledWith( 'warn',
			'mapdata group load failed with error Error: ExternalData has no url for group undefined' );
		expect( result.length ).toBe( 2 );
		expect( result[ 0 ].id ).toBe( 'group1' );
		expect( result[ 0 ].isExternal ).toBe( false );
		expect( result[ 0 ].failed ).toBe( true );
		expect( result[ 1 ].isExternal ).toBe( true );
	} );
} );
