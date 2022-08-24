# Wikimedia MapData release notes

### Version 0.7.0 (2022-08-24)
`6189f444..db825a12`
* Add basic jest tests for Group.External.js
* Added geopoints

### Version 0.6.0 (2021-11-29)
`27f68418..6189f444`
* Add basic unit tests
* Fix obvious copy-paste error in HybridGroup.parse()
* Relay optional revision ID parameter
* Remove wikidata attributes
* Remove wrappers.bind
* Use 'encodeURIComponent' instead of 'encodeURI'

### Version 0.5.0 (2018-04-13)
`e022430d..27f68418`
* Build: Add Gruntfile, fix eslint to Wikimedia standards, and make pass
* No functional changes in this version.

### Version 0.4.0 (2017-01-04)
`e6dbcde9..e022430d`
* Add attributions for Commons external data

### Version 0.3.2 (2017-02-09)
`dcd526f6..e6dbcde9`
* v0.3.2 parse attributions for geomask groups

### Version 0.3.1 (2017-01-03)
`a752c36b..dcd526f6`
* Added support for 'page' externalData

### Version 0.3.0 (2016-10-27)
`8b3f9552..a752c36b`
* loadGroups should always resolve with the worthy groups, whether they succeeded loading or not

### Version 0.2.5 (2016-10-26)
`4ee34929..8b3f9552`
* keep service and url externaldata props

### Version 0.2.4 (2016-10-25)
`f2dbb7ec..4ee34929`
* Implemented geomask support

### Version 0.2.3 (2016-10-21)
`65aad9fd..f2dbb7ec`
* Should default to empty object when API returns nothing for the group

### Version 0.2.2 (2016-10-21)
`74ea2fc7..65aad9fd`
* Add boolean to easily identify a group as external

### Version 0.2.1 (2016-10-19)
`53c9720d..74ea2fc7`
* Internal groups fetch should keep the promise in memory
* Multiple datastores, minor changes for node

### Version 0.2.0 (2016-10-11)
`bda2208d..53c9720d`
* First version of Data Manager, tested in Kartographer only
* Major rewrite of promise support
* Make it rollup compliant

### Version 0.1.0 (2016-10-07)
* Initial release
