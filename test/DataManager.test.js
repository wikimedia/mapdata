'use strict';

const wrappers = require( './util' );
const dataManagerLib = require( '../src/DataManager' );

describe( 'DataManager loadGroups', () => {
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
			mwApi
		} );

		const result = await dataManager.loadGroups( [ 'group1' ], title, revid );
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
		expect( result[ 0 ].getGeoJSON() ).toEqual( expect.objectContaining( externalResponse ) );
	} );

	test( 'mapdata network error is returned', () => {
		const mwApi = jest.fn().mockRejectedValue( new Error( 'Bad net' ) );
		const dataManager = dataManagerLib( {
			...wrappers,
			mwApi
		} );

		expect( () => dataManager.loadGroups( [ 'group1' ] ) ).rejects.toThrow( 'Bad net' );
	} );

	test( 'empty mapdata is returned as failed group', async () => {
		const apiResponse = {
			query: {
				pages: [ {
					mapdata: JSON.stringify( { group1: null } )
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
		expect( result[ 0 ].failed ).toStrictEqual( true );
		expect( result[ 0 ].failureReason )
			.toStrictEqual( new Error( 'Received empty response for group "group1"' ) );
	} );

	test( 'no mapdata in response throws exception', () => {
		const mwApi = jest.fn().mockResolvedValue( {} );
		const dataManager = dataManagerLib( {
			...wrappers,
			mwApi
		} );

		expect( () => dataManager.loadGroups( [ 'group1' ] ) )
			.rejects.toThrow( 'Cannot read propert' );
	} );

	test( 'failure from fetch is returned', async () => {
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
		const mwApi = jest.fn().mockResolvedValue( apiResponse );
		const dataManager = dataManagerLib( {
			...wrappers,
			mwApi
		} );

		const result = await dataManager.loadGroups( [ 'group1' ] );
		expect( result.length ).toBe( 1 );
		expect( result[ 0 ].failed ).toBe( true );
		expect( result[ 0 ].failureReason )
			.toStrictEqual( new Error( 'ExternalData has no url' ) );
	} );

	test( 'failure from parse is returned', async () => {
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
		const mwApi = jest.fn().mockResolvedValue( apiResponse );
		const getJSON = jest.fn().mockResolvedValue( {} );
		const dataManager = dataManagerLib( {
			...wrappers,
			mwApi,
			getJSON
		} );

		const result = await dataManager.loadGroups( [ 'group1' ] );
		expect( result.length ).toBe( 1 );
		expect( result[ 0 ].failed ).toBe( true );
		expect( result[ 0 ].failureReason )
			.toStrictEqual( new Error( 'Unknown externalData service "foo"' ) );
	} );
} );

describe( 'DataManager load', () => {
	test( 'happy ExternalData', async () => {
		const inlineData = {
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [ [
					[ 1, 2 ], [ 3, 4 ]
				] ]
			}
		};
		const unexpandedExternalData = {
			type: 'ExternalData',
			service: 'geoshape',
			url: 'http://a.test/'
		};
		const geoJSON = [
			inlineData,
			unexpandedExternalData
		];
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
			getJSON
		} );
		const result = await dataManager.load( geoJSON );
		expect( result.length ).toBe( 2 );
		expect( result[ 0 ].getGeoJSON() ).toStrictEqual( {
			...unexpandedExternalData,
			...externalResponse
		} );
		expect( result[ 1 ].getGeoJSON() ).toStrictEqual( [ inlineData ] );
	} );

	test( 'mixed failure due to net error', async () => {
		const inlineData = {
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [ [
					[ 1, 2 ], [ 3, 4 ]
				] ]
			}
		};
		const unexpandedExternalData = {
			type: 'ExternalData',
			service: 'geoshape',
			url: 'http://a.test/'
		};
		const geoJSON = [
			inlineData,
			unexpandedExternalData
		];
		const getJSON = jest.fn().mockRejectedValue( new Error( 'Bad net' ) );
		const dataManager = dataManagerLib( {
			...wrappers,
			getJSON
		} );
		const result = await dataManager.load( geoJSON );
		expect( result.length ).toBe( 2 );
		expect( result[ 0 ].failed ).toBe( true );
		expect( result[ 0 ].failureReason.message ).toStrictEqual( 'Bad net' );
		expect( result[ 0 ].getGeoJSON() ).toStrictEqual( unexpandedExternalData );
		expect( result[ 1 ].failed ).toBe( false );
		expect( result[ 1 ].getGeoJSON() ).toStrictEqual( [ inlineData ] );
	} );

	test( 'mixed failure due to invalid ExternalData', async () => {
		const inlineData = {
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [ [
					[ 1, 2 ], [ 3, 4 ]
				] ]
			}
		};
		const unexpandedExternalData = { type: 'ExternalData' };
		const geoJSON = [
			inlineData,
			unexpandedExternalData
		];
		const getJSON = jest.fn();
		const dataManager = dataManagerLib( {
			...wrappers,
			getJSON
		} );
		const result = await dataManager.load( geoJSON );
		expect( getJSON ).not.toBeCalled();
		expect( result.length ).toBe( 2 );
		expect( result[ 0 ].failed ).toBe( true );
		expect( result[ 0 ].failureReason.message ).toStrictEqual( 'ExternalData has no url' );
		expect( result[ 0 ].getGeoJSON() ).toStrictEqual( unexpandedExternalData );
		expect( result[ 1 ].failed ).toBe( false );
		expect( result[ 1 ].getGeoJSON() ).toStrictEqual( [ inlineData ] );
	} );
} );
