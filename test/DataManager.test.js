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
} );
