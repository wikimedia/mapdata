'use strict';

const externalDataLoaderLib = require( '../src/ExternalDataLoader' );
const { createPromise } = require( './util' );

describe( 'ExternalDataLoader', () => {
	test( 'fetch happily', async () => {
		const data = { foo: 'bar' };
		const mockGetJSON = jest.fn().mockResolvedValue( data );
		const loader = externalDataLoaderLib(
			mockGetJSON,
			createPromise
		);

		const url = 'http://a.test/';
		const group = { url };
		const result = await loader.fetch( group );
		expect( mockGetJSON ).toHaveBeenCalledWith( url );
		expect( result ).toStrictEqual( data );
	} );

	test( 'fetch handles missing url', () => {
		const mockGetJSON = jest.fn();
		const loader = externalDataLoaderLib(
			mockGetJSON,
			createPromise
		);

		const group = {};
		expect( () => loader.fetch( group ) ).rejects.toThrow( 'ExternalData has no url' );
		expect( mockGetJSON ).not.toHaveBeenCalled();
	} );

	test( 'fetch bubbles up network error', () => {
		const error = new Error( 'Bad net' );
		const mockGetJSON = jest.fn().mockRejectedValue( error );
		const loader = externalDataLoaderLib(
			mockGetJSON,
			createPromise
		);

		const url = 'http://a.test/';
		const group = { url };
		expect( () => loader.fetch( group ) ).rejects.toThrow( error );
		expect( mockGetJSON ).toHaveBeenCalledWith( url );
	} );
} );
