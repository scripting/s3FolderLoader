const myProductName = "s3FolderLoader", myVersion = "0.4.8";    

exports.load = frontendForLoadFromS3;

const fs = require ("fs");
const utils = require ("daveutils");
const s3 = require ("daves3"); 

function loadFromS3 (s3path, basefolder, callback) {
	var logstruct = new Object (); //what we're going to return to caller -- 4/26/20 by DW
	var logtext = "", ctFilesChanged = 0;
	function consoleLog (s) {
		logtext += s + "<br>";
		console.log (s);
		}
	function getFileList (s3path, callback) {
		var theList = new Array ();
		s3.listObjects (s3path, function (obj) {
			if (obj.flLastObject !== undefined) {
				if (callback != undefined) {
					callback (theList);
					}
				}
			else {
				theList [theList.length] = obj;
				}
			});
		}
	function downloadFile (s3path, f, whenModified, callback) {
		consoleLog ("downloadFile: s3path == " + s3path);
		ctFilesChanged++;
		s3.getObject (s3path, function (err, data) {
			if (err) {
				console.log ("downloadFile: error reading S3 file == " + err.message);
				logstruct [s3path] = {
					err
					}
				callback ();
				}
			else {
				fs.writeFile (f, data.Body, function (err) {
					if (err) {
						console.log ("downloadFile: error writing local file == " + err.message);
						logstruct [s3path] = {
							err
							}
						}
					else {
						whenModified = new Date (whenModified);
						logstruct [s3path] = {
							whenModified
							};
						fs.utimes (f, whenModified, whenModified, function () {
							callback ();
							});
						}
					}); 
				}
			});
		}
	var splitpath = s3.splitPath (s3path);
	var bucketname = splitpath.Bucket;
	getFileList (s3path, function (theList) {
		function considerFile (ixfile) {
			if (ixfile < theList.length) {
				var obj = theList [ixfile], relfilepath = utils.stringDelete (obj.Key, 1, splitpath.Key.length), f = basefolder + relfilepath;
				utils.sureFilePath (f, function () {
					fs.exists (f, function (flExists) {
						if (flExists) {
							fs.stat (f, function (err, stats) {
								var remoteModDate = new Date (obj.LastModified);
								var localModDate = new Date (stats.mtime);
								if (remoteModDate > localModDate) { //it's been modified
									downloadFile (bucketname + "/" + obj.Key, f, obj.LastModified, function () {
										considerFile (ixfile + 1);
										});
									}
								else {
									considerFile (ixfile + 1);
									}
								});
							}
						else {
							downloadFile (bucketname + "/" + obj.Key, f, obj.LastModified, function () {
								considerFile (ixfile + 1);
								});
							}
						});
					});
				}
			else {
				callback (utils.jsonStringify (logstruct)); //4/26/20 by DW
				}
			}
		considerFile (0);
		});
	}

function frontendForLoadFromS3 (s3path, basefolder, callback) { //8/12/23 by DW
	try {
		loadFromS3 (s3path, basefolder, callback);
		}
	catch (err) {
		callback (new Object ()); //return an empty object
		}
	}



