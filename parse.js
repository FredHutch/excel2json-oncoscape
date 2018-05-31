// https://www.npmjs.com/package/csvtojson
// node --max-old-space-size=3000 trying to mimic lambda specification

const csv=require('csvtojson')
const asyncLoop = require('node-async-loop');
const async = require("async");
const jsonfile = require('jsonfile');
const zlib = require('zlib');
const testFolder = '.';
const fs = require('fs');
const _ = require('lodash');
var save = require('./data_uploading_modules/DatasetSave.js');
var serialize = require('./data_uploading_modules/DatasetSerialize.js');
var ser
var csvFiles;
var data = [];
var events = [];
var jsonObj;
var uploadResults = [];
console.log(csvFiles);
var csv2json = function(csvFilePath) {
    return new Promise((resolve, reject) => { 
        csv()
        .fromFile(csvFilePath)
        .then((jsonObj)=>{
            console.log(jsonObj.length);
            resolve(jsonObj);
        });
    });
}

var serialization = function(jsonObj, file) {
    var obj = {};
    var res = {};
    var type = file.split('-')[0].toUpperCase();
    obj.type = type;
    obj.name = file;
    console.log('type is: ', type);
    var regex_n = new RegExp('\-N');
    var regex_b = new RegExp('\-B');
    var regex_s = new RegExp('\-S');
    var regex_d = new RegExp('\-D');
    if (type === 'MATRIX') {
        var ids = Object.keys(jsonObj[0]);
        ids.splice(0, 1);
        var genes = jsonObj.map(j => j['Gene Symbol']);
        var values = jsonObj.map(dd => {
            var val = _.values(dd);
            val.splice(1, 0);
            return val;
        });
        res.ids = ids;
        res.genes = genes;
        res.values = values;
        obj.res = res;
    } else if (type === 'PATIENT') {
        var keys_uppercase = Object.keys(jsonObj[0]).map(k=>k.toUpperCase());
        var keys = Object.keys(jsonObj[0]);
        var ids = jsonObj.map(j=>j[keys[keys_uppercase.indexOf('PATIENTID')]]);
        var fields = {};
        keys.splice(keys_uppercase.indexOf('PATIENTID'), 1);
        keys.forEach(k => {
            if (k.match(regex_n) !== null) {
                var col_values = jsonObj.map(j=>parseFloat(j[k]));
                v = {
                    'min' : _.min(col_values),
                    'max' : _.max(col_values)
                }
            } else { //default type is string
                v = _.uniq(jsonObj.map(j=>j[k]));
                if(v.indexOf(undefined) > -1) {
                    v.splice(v.indexOf(undefined), 1);
                }
            }
            fields[k] = v;
        });
        var value = jsonObj.map(j => {
            var arr = [];
            keys.forEach(k => {
                if (k.match(regex_n) !== null) {
                    arr.push(parseFloat(j[k]));
                } else {
                    arr.push(fields[k].indexOf(j[k]));
                }
            });
            return arr;
        });
        res.ids = ids;
        res.fields = fields;
        res.value = value;
        obj.res = res;
    } else if (type === 'SAMPLE') {
        var keys_uppercase = Object.keys(jsonObj[0]).map(k=>k.toUpperCase());
        var keys = Object.keys(jsonObj[0]);
        var ids = jsonObj.map(j=>j[keys[keys_uppercase.indexOf('SAMPLEID')]]);
        var fields = {};
        keys.splice(keys_uppercase.indexOf('SAMPLEID'), 1);
        keys.splice(keys_uppercase.indexOf('PATIENTID'), 1);
        keys.forEach(k => {
            if (k.match(regex_n) !== null) {
                var col_values = jsonObj.map(j=>parseFloat(j[k]));
                v = {
                    'min' : _.min(col_values),
                    'max' : _.max(col_values)
                }
            } else { //default type is string
                v = _.uniq(jsonObj.map(j=>j[k]));
                if(v.indexOf(undefined) > -1) {
                    v.splice(v.indexOf(undefined), 1);
                }
            }
            fields[k] = v;
        });
        var value = jsonObj.map(j => {
            var arr = [];
            keys.forEach(k => {
                if (k.match(regex_n) !== null) {
                    arr.push(parseFloat(j[k]));
                } else {
                    arr.push(fields[k].indexOf(j[k]));
                }
            });
            return arr;
        });
        res.ids = ids;
        res.fields = fields;
        res.value = value;
        obj.res = res;
    } else if (type === 'EVENT') {
        var map = {};
        var category = file.split('-')[1];
        map['category'] = category;
        var subCategory;
        if (file.split('-').length > 2) {
            subCategory = file.split('-')[2];
            map['subCategory'] = subCategory;
        };

        var keys_uppercase = Object.keys(jsonObj[0]).map(k=>k.toUpperCase());
        var keys = Object.keys(jsonObj[0]);
        var patientIDLocation = keys_uppercase.indexOf('PATIENTID');
        var startDateLocation = keys_uppercase.indexOf('START');
        var endDateLocation = keys_uppercase.indexOf('END');
        var reservedKeyLocations = [patientIDLocation, startDateLocation, endDateLocation];
        var nonreservedKeys = keys.filter((h, i)=>reservedKeyLocations.indexOf(i) === -1);
        
        var value = jsonObj.map(d=>{
            var arr = [];
            arr[0] = d[keys[patientIDLocation]];
            arr[1] = parseInt(d[keys[startDateLocation]]);
            arr[2] = parseInt(d[keys[endDateLocation]]);
            var o = {};
            nonreservedKeys.forEach(h=>{
                if( h.match(regex_n) !== null) {
                    o[h] = parseFloat(d[h]);
                } else {
                    o[h] = d[h];
                } 
            });
            arr[3] = o;
            return arr;
        });
        res.map = map;
        res.value = value;
        obj.res = res;
    } else if (type === 'MUTATION') {
        var keys_uppercase = Object.keys(jsonObj[0]).map(k=>k.toUpperCase());
        var keys = Object.keys(jsonObj[0]);
        var ids = _.uniq(jsonObj.map(j => j[keys[keys_uppercase.indexOf('SAMPLEID')]]));
        var genes = _.uniq(jsonObj.map(j => j[keys[keys_uppercase.indexOf('GENE')]]));
        var mutTypes = _.uniq(jsonObj.map(j => j[keys[keys_uppercase.indexOf('TYPE')]]));
        var values = jsonObj.map((d)=>{
            return(ids.indexOf(d[keys[keys_uppercase.indexOf('SAMPLEID')]]) + '-' +
                   genes.indexOf(d[keys[keys_uppercase.indexOf('GENE')]]) + '-' +
                   mutTypes.indexOf(d[keys[keys_uppercase.indexOf('TYPE')]]));
        });
        res.ids = ids;
        res.genes = genes;
        res.mutationTypes = mutTypes;
        res.values = values;
        obj.res = res;
    }
    return obj;
};
fs.readdir(testFolder, (err, files) => {
    csvFiles = files.filter(f => f.indexOf('.csv') > 0);
    async.each(csvFiles,
        function(file, callback){
          console.log('file', file);
          csv2json(file).then(d => {
                jsonObj = d;
                var meta = {};
                console.log('Done');
                file = file.replace('.csv', '');
                // heavy compute
                var result = serialization(jsonObj, file);
                var type = file.split('-')[0].toUpperCase();
                if (type === 'EVENT') {
                    events.push(result);
                } else {
                    data.push(result);
                    console.log('*****', file);
                    var jsonFileName = file + '.json.gz';
                    console.log('jsonFileName: ', jsonFileName);
                    meta['name'] = file;
                    meta['dataType'] = type;
                    meta['file'] = jsonFileName;
                    uploadResults.push(meta);
                    zlib.gzip(JSON.stringify(result), level=9, function(err, result){
                        jsonfile.writeFile(jsonFileName, result, function(err) {
                            console.error(err);
                        });
                    });
                    
                }
                callback();
            });
        },
        function(err){
            if (err) {
                console.error(err.message);
            } else {
                var obj = {};
                var meta = {};
                obj.type = 'EVENT';
                obj.name = 'EVENT';
                var o = {};
                var m = {};
                var v = [];
                events.forEach(e=> {
                    m[e.res.map.subCategory] = e.res.map.category;
                    v = v.concat(e.res.value);
                });
                var type_keys = Object.keys(m);
                v.forEach(elem => elem[1] = type_keys.indexOf(elem[1]));
                o.map = m;
                o.value = v;
                obj.res = o;
                data.push(obj);
                var jsonFileName = 'events.json.gz';
                meta['name'] = 'EVENT';
                meta['dataType'] = 'EVENT';
                meta['file'] = jsonFileName;
                uploadResults.push(meta);
                zlib.gzip(JSON.stringify(obj), level=9, function(err, result){
                    jsonfile.writeFile(jsonFileName, result, function(err) {
                        console.error(err);
                    });
                });
            } 
        }
      );
});


var manifest = serialize.manifest(data, uploadResults);
jsonfile.writeFile('manifest.json', manifest, function(err){
    console.error(err);
});