var q = require('q');
var rp = require('request-promise');
var fs = require('fs');
var json2csv = require('json2csv');
var config = require('./config/config.json');
var path = require('path');
var outputFilePath = path.join(__dirname, '/output/rjtables.csv');

getTables()
.then(getColumns)
.then(createCSV)
.then(null, function (err) {
	console.log(outputFilePath);
	console.error(err);
});

/*
 * @returns A promise containing an array of table objects
 */
function getTables () {
	var deferred = q.defer();
	deferred.resolve(requestTables()
			.then(function (response) {
				console.log('Table data received!');
				return response.tables;
			}));
	return deferred.promise;
}

/*
 * @returns A promise containing json of table objects
 */
function requestTables () {
	console.log('Requesting table data...');
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
	console.log('Requesting column data for ' + table.name + '...');
	var deferred = q.defer()
	deferred.resolve(requestColumns(table.id)
			.then(function (response) {
				console.log('Data received for table: ' + table.name);
				return response.columns
					.map(function(column) {
						return {table: table.name, column: column.name};
					});
			}));
	return deferred.promise;
}

/*
/bin/bash: q: command not found
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
}

function flattenTableColumns (arr) {
	return [].concat.apply([], arr);
}

function createCSV (data) {
	console.log("Saving csv file...");
	var fields = ['table', 'column'];
	json2csv({ data: data, fields: fields }, function(err, csv) {
		if (err) return console.error(err);

	    	fs.writeFile(outputFilePath, csv, function(err) {
			if (err) throw err;
			console.log('File saved!');
		});

	});
}
