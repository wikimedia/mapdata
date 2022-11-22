'use strict';

const { isPlainObject } = require( './util' );
const externalDataParserLib = require( '../src/ExternalDataParser' );

describe( 'ExternalDataParser isExternal handles', () => {
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
	test.todo( 'page with data' );
	test.todo( 'page without data' );
	test.todo( 'geomask is transformed' );
	test.todo( 'bad geomask' );
	test.todo( 'geoshape' );
	test.todo( 'bad geoshape' );
	test.todo( 'unknown badness' );
} );
