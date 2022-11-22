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
		const title = 'Example title';
		const revid = '123';
		const dataManager = dataManagerLib( {
			...wrappers,
			mwApi,
			title,
			revid
		} );

		const result = await dataManager.loadGroups( [ 'group1' ] );
		expect( mwApi ).toBeCalledWith( {
			action: 'query',
			formatversion: '2',
			revids: revid,
			prop: 'mapdata',
			mpdlimit: 'max',
			mpdgroups: 'group1'
		} );
		expect( result.length ).toBe( 1 );
		expect( result[ 0 ].getGeoJSON() ).toStrictEqual( feature );
	} );

	test( 'happy ExternalData', async () => {
		const feature = {
			type: 'ExternalData',
			service: 'geoshape',
			url: 'http://a.test/'
		};
		const mapdata = { group1: feature };
		const apiResponse = {
			query: {
				pages: [ {
					mapdata: JSON.stringify( mapdata )
				} ]
			}
		};
		const mwApi = jest.fn().mockResolvedValue( apiResponse );
		const externalResponse = {
			type: 'Feature',
			geometry: {
				coordinates: [ 13, 47 ],
				type: 'Point'
			}
		};
		const getJSON = jest.fn().mockResolvedValue( externalResponse );
		const dataManager = dataManagerLib( {
			...wrappers,
			mwApi,
			getJSON
		} );

		const result = await dataManager.loadGroups( [ 'group1' ] );
		expect( result.length ).toBe( 1 );
		// FIXME: This is a weird and unuseful convention.
		expect( result[ 0 ].id ).toStrictEqual( JSON.stringify( feature ) );
		expect( result[ 0 ].isExternal ).toStrictEqual( true );
		expect( result[ 0 ].getGeoJSON() ).toEqual( expect.objectContaining( externalResponse ) );
	} );

	test( 'failure from fetch is logged and returned', async () => {
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

		expect( result.length ).toBe( 2 );
		expect( result[ 0 ].id ).toBe( 'group1' );
		expect( result[ 0 ].isExternal ).toBe( false );
		expect( result[ 0 ].failed ).toBe( true );
		// FIXME: This is a deceiving, broken group.
		expect( result[ 1 ].isExternal ).toBe( true );
		expect( result[ 1 ].failed ).toBeUndefined();
		expect( log ).toHaveBeenCalledWith( 'warn',
			'mapdata group load failed with error Error: ExternalData has no url for group undefined' );
	} );

	test( 'failure from parse is logged and returned', async () => {
		const feature = [ {
			type: 'ExternalData',
			service: 'foo',
			url: 'http://a.test/'
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
		const getJSON = jest.fn().mockResolvedValue( {} );
		const dataManager = dataManagerLib( {
			...wrappers,
			log,
			mwApi,
			getJSON
		} );

		const result = await dataManager.loadGroups( [ 'group1' ] );
		expect( result.length ).toBe( 2 );
		expect( result[ 0 ].failed ).toBe( true );
		// FIXME: This is a deceiving, broken group.
		expect( result[ 1 ].isExternal ).toBe( true );
		expect( result[ 1 ].failed ).toBeUndefined();
		expect( log ).toHaveBeenCalledWith( 'warn',
			'mapdata group load failed with error Error: Unknown externalData service "foo" for group undefined' );
	} );
} );
