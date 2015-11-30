var q = require('q');
var rp = require('request-promise');
var config = require('./config/config.json');

getTables()
.then(getColumns)
.then(function (arr) {
console.log("Made it here");
console.log(arr);
});
//.then(createCSV);

/*
 * @returns A promise containing an array of table objects
 */
function getTables () {
	var deferred = q.defer();
	deferred.resolve(requestTables()
			.then(function (response) {
				return response.tables;
			}));
	return deferred.promise;
}

/*
 * @returns A promise containing json of table objects
 */
function requestTables () {
	var options = {
		method: 'GET',
		headers: { 'x-rjm-api-key': config['x-rjm-api-key'] },
		json: true
	};
	options.url = 'https://api.rjmetrics.com/0.1/client/' + config['rj-client-id'] + '/table';
	return rp(options);
}

/*
 * @returns A promise containing an array of objects contain table and column name
 */
function getColumns (tables) {
	var deferred = q.defer();
	deferred.resolve(q.all(tables.map(getTableColumns)).then(flattenTableColumns));
	return deferred.promise;
}

/*
 * @returns A promise containing an array of arrays of objects containing table and column names
 */
function getTableColumns (table) {
	var deferred = q.defer()
	deferred.resolve(requestColumns(table.id)
			.then(function (response) {
				return response.columns
					.map(function(column) {
						return {table: table.name, column: column.name};
					});
			}));
	return deferred.promise;
}

/*
 * @returns A promise containing an array of column objects
 */
function requestColumns (tableId) {
	if (!tableId) return false;

	var options = {
		method: 'GET',
		headers: { 'x-rjm-api-key': config['x-rjm-api-key'] },
		json: true
	};
	options.url = 'https://api.rjmetrics.com/0.1/client/' + config['rj-client-id'] + '/table/' + tableId;
	
	return rp(options);
	//rp(options).then(function (res) { console.log(res.columns); });
}

function flattenTableColumns (arr) {
	return [].concat.apply([], arr);
}

function createCSV () {}
