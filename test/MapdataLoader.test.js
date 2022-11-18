'use strict';

const { createPromise, createResolvedPromise } = require( './util' );
const MapdataLoader = require( '../src/MapdataLoader' );

describe( 'MapdataLoader', function () {
	test( 'fetch ignores when groups are empty', () => {
		const mwApi = jest.fn();

		const loader = new MapdataLoader( createPromise, createResolvedPromise, mwApi );
		loader.fetch();

		expect( mwApi ).toHaveBeenCalledTimes( 0 );
	} );

	test( 'fetch queries title and group', () => {
		const apiCallback = {
			then: jest.fn()
		};
		const mwApi = jest.fn( () => apiCallback );
		const title = 'A title';
		const groupId = '123abc';

		const loader = new MapdataLoader(
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

	test( 'fetch queries revid', () => {
		const apiCallback = {
			then: jest.fn()
		};
		const mwApi = jest.fn( () => apiCallback );
		const title = 'A title';
		const groupId = '123abc';
		const revid = '123';

		const loader = new MapdataLoader(
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
