/* eslint-env node */
module.exports = function Gruntfile( grunt ) {
	grunt.loadNpmTasks( 'grunt-eslint' );

	grunt.initConfig( {
		eslint: {
			code: {
				src: [
					'*.js',
					'**/*.js',
					'!node_modules/**'
				]
			}
		}
	} );

	grunt.registerTask( 'test', 'eslint' );
	grunt.registerTask( 'default', 'test' );
};
