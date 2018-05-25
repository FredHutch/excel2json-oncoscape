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

var serialization = function(jsonObj, filename) {
    var obj = {};
    var res = {};
    var type = filename.split('-')[0].toUpperCase();
    if (type === 'MATRIX') {
        var ids = Object.keys(jsonObj[0]);
        ids = ids.splice(0, 1);
        var genes = data.map(jsonObj => jsonObj['Gene Symbol']);
        var values = jsonObj.map(dd => _.values(dd));
        res.ids = ids;
        res.genes = genes;
        res.values = values;
        obj.res = res;
        obj.type = type;
        obj.name = filename;
    } else if (type === 'PATIENT') {

    } else if (type === 'SAMPLE') {

    } else if (type === 'EVENT') {

    } else if (type === 'GENESETS') {

    } else if (type === 'MUTATION') {

    }
    return obj;
}

// Async / await usage
var data = [];
var jsonObj;
var filename;
async.each(csvFiles, (file) =>{
    console.log(file);
    csv2json(file).then(d=>{
        jsonObj = d;
        filename = file;
        data.push(serialization(d, file));
    });
}, err => {
    if (err) console.error(err.message);
});



