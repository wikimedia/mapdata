'use strict';

const { createPromise, createResolvedPromise } = require( './util' );
const mapdataLoaderFactory = require( '../src/MapdataLoader' );

describe( 'MapdataLoader', function () {
	test( 'fetch falls through when groups are empty', async () => {
		const mwApi = jest.fn();

		const loader = mapdataLoaderFactory( undefined, createResolvedPromise, mwApi );
		await loader.fetch();

		expect( mwApi ).toHaveBeenCalledTimes( 0 );
	} );

	test( 'network error is bubbled up', () => {
		const mwApi = jest.fn().mockRejectedValue( new Error( 'Bad net' ) );
		const loader = mapdataLoaderFactory( createPromise, createResolvedPromise, mwApi );

		const promise = loader.fetchGroup( 'group1' );
		loader.fetch();
		expect( promise ).rejects.toThrow( 'Bad net' );
	} );

	test( 'fetch queries title and group', async () => {
		const apiCallback = {
			then: jest.fn()
		};
		const mwApi = jest.fn( () => apiCallback );
		const title = 'A title';
		const groupId = '123abc';

		const loader = mapdataLoaderFactory(
			createPromise,
			createResolvedPromise,
			mwApi,
			undefined,
			title
		);
		loader.fetchGroup( groupId );
		loader.fetch();

		expect( mwApi ).toHaveBeenCalledWith( {
			action: 'query',
			formatversion: '2',
			titles: title,
			prop: 'mapdata',
			mpdlimit: 'max',
			mpdgroups: groupId
		} );
	} );

	test( 'fetch queries revid', async () => {
		const apiCallback = {
			then: jest.fn()
		};
		const mwApi = jest.fn( () => apiCallback );
		const title = 'A title';
		const groupId = '123abc';
		const revid = '123';

		const loader = mapdataLoaderFactory(
			createPromise,
			createResolvedPromise,
			mwApi,
			undefined,
			title,
			revid
		);
		loader.fetchGroup( groupId );
		loader.fetch();

		expect( mwApi ).toHaveBeenCalledWith( {
			action: 'query',
			formatversion: '2',
			revids: revid,
			prop: 'mapdata',
			mpdlimit: 'max',
			mpdgroups: groupId
		} );
	} );
} );
