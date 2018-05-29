// https://www.npmjs.com/package/csvtojson
// node --max-old-space-size=3000 trying to mimic lambda specification

const csv=require('csvtojson')
const asyncLoop = require('node-async-loop');
const async = require("async");
const jsonfile = require('jsonfile');
const testFolder = '.';
const fs = require('fs');
const _ = require('lodash');
var csvFiles;
var data = [];
var events = [];
var jsonObj;
console.log('test1');
console.log(csvFiles);
fs.readdir(testFolder, (err, files) => {
    csvFiles = files.filter(f => f.indexOf('.csv') > 0);
    async.each(csvFiles,
        function(file, callback){
          console.log('file', file);
          csv2json(file).then(d => {
                jsonObj = d;
                console.log('Done');
                file = file.replace('.csv', '');
                var result = serialization(jsonObj, file);
                if (file.split('-')[0].toUpperCase() === 'EVENT') {
                    // var result = serialization(d, file);
                    events.push(result);
                } else {
                    console.log('*****', file);
                    var jsonFileName = file + '.json';
                    console.log('jsonFileName: ', jsonFileName);
                    jsonfile.writeFile(jsonFileName, result, function(err) {
                        console.error(err);
                    });
                }
                callback();
            });
        },
        function(err){
            console.log('am I here?????????');
            if (err) {
                console.log('test');
                console.error(err.message);
            } else {
                var obj = {};
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
                var jsonFileName = 'events.json';
                jsonfile.writeFile(jsonFileName, obj, function(err) {
                    console.error(err);
                });
            } 
        }
      );
})

var csv2json = function(csvFilePath){
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
        console.log(obj);
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
        console.log(obj);
    } else if (type === 'EVENT') {
        var map = {};
        // file = file.replace('.csv', '');
        console.log('&&&&&&', file);
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
        console.log(obj);
    }
    return obj;
};



  

// asyncLoop(csvFiles, function(file, next){ 
//     console.log(file);
//     csv2json(file).then(d => {
//         jsonObj = d;
//         console.log('Done');
//         file = file.replace('.csv', '');
//         var result = serialization(jsonObj, file);
//         if (file.split('-')[0].toUpperCase() === 'EVENT') {
//             // var result = serialization(d, file);
//             events.push(result);
//         } else {
//             console.log('*****', file);
//             var jsonFileName = file + '.json';
//             console.log('jsonFileName: ', jsonFileName);
//             jsonfile.writeFile(jsonFileName, result, function(err) {
//                 console.error(err);
//             });
//         }
//         next();
//     });
// }, err => {
//     if (err) {
//         console.error(err.message);
//     } else {
//         var obj = {};
//         obj.type = 'EVENT';
//         obj.name = 'EVENT';
//         var o = {};
//         var m = {};
//         var v = [];
//         events.forEach(e=> {
//             m[e.res.map.subCategory] = e.res.map.category;
//             v = v.concat(e.res.value);
//         });
//         var type_keys = Object.keys(m);
//         v.forEach(elem => elem[1] = type_keys.indexOf(elem[1]));
//         o.map = m;
//         o.value = v;
//         obj.res = o;
//         var jsonFileName = 'events.json';
//         jsonfile.writeFile(jsonFileName, obj, function(err) {
//             console.error(err);
//         });
//     } 
// });
