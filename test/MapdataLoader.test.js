'use strict';

const { createResolvedPromise, extend } = require( './util' );
const mapdataLoaderFactory = require( '../src/MapdataLoader' );

describe( 'MapdataLoader', function () {
	test( 'fetch falls through when groups are empty', async () => {
		const mwApi = jest.fn();

		const loader = mapdataLoaderFactory( undefined, createResolvedPromise, mwApi );
		await loader.fetchGroups( [] );

		expect( mwApi ).toHaveBeenCalledTimes( 0 );
	} );

	test( 'network error is bubbled up', () => {
		const mwApi = jest.fn().mockRejectedValue( new Error( 'Bad net' ) );
		const loader = mapdataLoaderFactory( undefined, undefined, mwApi );
		expect( () => loader.fetchGroups( [ 'group1' ] ) ).rejects.toThrow( 'Bad net' );
	} );

	test( 'api error is returned', () => {
		const apiError = {
			error: {
				code: 'kartographer-conflicting-revids',
				info: 'Foo bar'
			}
		};
		const mwApi = jest.fn().mockResolvedValue( apiError );
		const loader = mapdataLoaderFactory( undefined, undefined, mwApi );
		expect( () => loader.fetchGroups( [ 'group1' ] ) ).rejects
			.toThrow( 'Mapdata error: Foo bar' );
	} );

	test( 'fetch queries title and group', async () => {
		const minimalMapdata = { query: { pages: [ { mapdata: '{}' } ] } };
		const mwApi = jest.fn().mockResolvedValue( minimalMapdata );
		const title = 'A title';
		const groupId = '123abc';

		const loader = mapdataLoaderFactory(
			extend,
			createResolvedPromise,
			mwApi
		);
		await loader.fetchGroups( [ groupId ], title );

		expect( mwApi ).toHaveBeenCalledWith( {
			action: 'query',
			formatversion: '2',
			titles: title,
			prop: 'mapdata',
			mpdlimit: 'max',
			mpdgroups: [ groupId ]
		} );
	} );

	test( 'fetch queries revid', async () => {
		const minimalMapdata = { query: { pages: [ { mapdata: '{}' } ] } };
		const mwApi = jest.fn().mockResolvedValue( minimalMapdata );
		const title = 'A title';
		const groupId = '123abc';
		const revid = '123';

		const loader = mapdataLoaderFactory(
			extend,
			createResolvedPromise,
			mwApi
		);
		await loader.fetchGroups( [ groupId ], title, revid );

		expect( mwApi ).toHaveBeenCalledWith( {
			action: 'query',
			formatversion: '2',
			revids: revid,
			prop: 'mapdata',
			mpdlimit: 'max',
			mpdgroups: [ groupId ]
		} );
	} );

	test( 'fetch queries uselang', async () => {
		const minimalMapdata = { query: { pages: [ { mapdata: '{}' } ] } };
		const mwApi = jest.fn().mockResolvedValue( minimalMapdata );
		const title = 'A title';
		const groupId = '123abc';
		const revid = '123';
		const lang = 'en-x-piglatin';

		const loader = mapdataLoaderFactory(
			extend,
			createResolvedPromise,
			mwApi
		);
		await loader.fetchGroups( [ groupId ], title, revid, lang );

		expect( mwApi ).toHaveBeenCalledWith( {
			action: 'query',
			formatversion: '2',
			revids: revid,
			prop: 'mapdata',
			mpdlimit: 'max',
			mpdgroups: [ groupId ],
			uselang: lang
		} );
	} );
} );
