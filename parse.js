// https://www.npmjs.com/package/csvtojson
// node --max-old-space-size=3000 trying to mimic lambda specification

const csv=require('csvtojson')
var async = require("async");
const testFolder = '.';
const fs = require('fs');
const _ = require('lodash');
var csvFiles;
fs.readdir(testFolder, (err, files) => {
    csvFiles = files.filter(f => f.indexOf('.csv') > 0)
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
        file = file.replace('.csv', '');
        var category = file.split('-')[1];
        var subCategory;
        if (file.split('-').length > 2) {
            subCategory = file.split('-')[2];
        };

        var keys_uppercase = Object.keys(jsonObj[0]).map(k=>k.toUpperCase());
        var keys = Object.keys(jsonObj[0]);
        var patientIDLocation = keys_uppercase.indexOf('PATIENTID');
        var startDateLocation = keys_uppercase.indexOf('START');
        var endDateLocation = keys_uppercase.indexOf('END');
        var reservedKeyLocations = [patientIDLocation, startDateLocation, endDateLocation];
        var nonreservedKeys = keys.filter((h, i)=>reservedKeyLocations.indexOf(i) === -1);
        


        res.map = map;
        res.value = value;
        obj.res = res;
    } else if (type === 'GENESETS') {

    } else if (type === 'MUTATION') {

    }
    return obj;
}

// Async / await usage
var data = [];
var jsonObj;
async.each(csvFiles, (file) =>{
    console.log(file);
    csv2json(file).then(d=>{
        jsonObj = d;
        console.log('Done');
        // data.push(serialization(d, file));
    });
}, err => {
    if (err) console.error(err.message);
});



