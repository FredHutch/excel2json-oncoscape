// https://www.npmjs.com/package/csvtojson
// node --max-old-space-size=7000 trying to mimic lambda specification

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

var gzip = zlib.createGzip({
    level: 9 // maximum compression
}), buffers=[], nread=0;

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
    console.log('type is: ', type);
    var regex_n = new RegExp('\-N');
    var regex_b = new RegExp('\-B');
    var regex_s = new RegExp('\-S');
    var regex_d = new RegExp('\-D');
    if (type === 'MATRIX') {
        var ids = Object.keys(jsonObj[0]);
        ids = ids.map(id=>id.replace('tcga-', ''));         
        ids = ids.map(id=>id.replace('TCGA-', ''));
        ids.splice(0, 1);
        var genes = jsonObj.map(j => j['Gene Symbol']);
        var values = jsonObj.map(dd => {
            var val = _.values(dd).map(d=>parseFloat(d));
            val.splice(0, 1);
            return val;
        });
        obj.type = 'matrix';
        obj.name = file.toLowerCase().replace('matrix-', '').replace('-','_').replace('_',' ');
        res.ids = ids;
        res.genes = genes;
        res.values = values;
        obj.res = res;
    } else if (type === 'PATIENT') {
        var keys_uppercase = Object.keys(jsonObj[0]).map(k=>k.toUpperCase());
        var keys = Object.keys(jsonObj[0]);
        var ids = jsonObj.map(j=>j[keys[keys_uppercase.indexOf('PATIENTID')]]);
        ids = ids.map(id=>id.replace('tcga-', ''));       
        ids = ids.map(id=>id.replace('TCGA-', ''));
        var survival_keys = ['vital_status', 'days_to_death', 'days_to_last_follow_up'];
        var fields = {};
        keys.splice(keys_uppercase.indexOf('PATIENTID'), 1);
        keys.forEach(k => {
            if (k.match(regex_n) !== null || survival_keys.indexOf(k) !== -1) {
                var col_values = jsonObj.map(j=>parseFloat(j[k]));
                v = {
                    'min' : _.min(col_values),
                    'max' : _.max(col_values)
                }
                fields[k] = v;
            } else { //default type is string
                v = _.uniq(jsonObj.map(j=>j[k]));
                if(v.indexOf(undefined) > -1) {
                    v.splice(v.indexOf(undefined), 1);
                } else if (v.indexOf('NA') > -1) {
                    v.splice(v.indexOf('NA'), 1);
                }
                if (v.length !== 0) {
                    fields[k] = v;
                } else {
                    keys.splice(keys.indexOf(k), 1);
                }
            }
            
        });
        var values = jsonObj.map(j => {
            var arr = [];
            keys.forEach(k => {
                if (k.match(regex_n) !== null || survival_keys.indexOf(k) !== -1) {
                    arr.push(parseFloat(j[k]));
                } else {
                    arr.push(fields[k].indexOf(j[k]));
                }
            });
            return arr;
        });
        obj.type = "clinical";
        obj.name = "clinical";
        res.ids = ids;
        res.fields = fields;
        res.values = values;
        obj.res = res;
    } else if (type === 'SAMPLE') {
        var keys_uppercase = Object.keys(jsonObj[0]).map(k=>k.toUpperCase());
        var keys = Object.keys(jsonObj[0]);
        var ids = jsonObj.map(j=>j[keys[keys_uppercase.indexOf('SAMPLEID')]]);
        ids = ids.map(id=>id.replace('tcga-', ''));         
        ids = ids.map(id=>id.replace('TCGA-', ''));
        var sampleIDLocation = keys_uppercase.indexOf('SAMPLEID');
        var patientIDLocation = keys_uppercase.indexOf('PATIENTID');
        var patient_keys = _.uniq(jsonObj.map(d=>d[keys[patientIDLocation]]));
        var patientSampleMapping = {};
        patient_keys.forEach(k=>{
            var kk = k.replace('TCGA-', '');
            patientSampleMapping[kk] = jsonObj.filter(d=>d[keys[patientIDLocation]]===k)
                                             .map(d=>d[keys[sampleIDLocation]])
                                             .map(d=>d.replace('TCGA-', ''));
        });

        // var fields = {};
        // keys.splice(keys_uppercase.indexOf('SAMPLEID'), 1);
        // keys.splice(keys_uppercase.indexOf('PATIENTID'), 1);
        // keys.forEach(k => {
        //     if (k.match(regex_n) !== null) {
        //         var col_values = jsonObj.map(j=>parseFloat(j[k]));
        //         v = {
        //             'min' : _.min(col_values),
        //             'max' : _.max(col_values)
        //         }
        //     } else { //default type is string
        //         v = _.uniq(jsonObj.map(j=>j[k]));
        //         if(v.indexOf(undefined) > -1) {
        //             v.splice(v.indexOf(undefined), 1);
        //         }
        //     }
        //     fields[k] = v;
        // });
        // var values = jsonObj.map(j => {
        //     var arr = [];
        //     keys.forEach(k => {
        //         if (k.match(regex_n) !== null) {
        //             arr.push(parseFloat(j[k]));
        //         } else {
        //             arr.push(fields[k].indexOf(j[k]));
        //         }
        //     });
        //     return arr;
        // });
        res = patientSampleMapping;
        // res.ids = ids;
        // res.fields = fields;
        // res.values = values;
        obj.name = 'psmap';
        obj.type = 'psmap';
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
        
        var values = jsonObj.map(d=>{
            var arr = [];
            arr[0] = d[keys[patientIDLocation]].replace('tcga-', '');
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
        res.values = values;
        obj.res = res;
    } else if (type === 'MUTATION') {
        var keys_uppercase = Object.keys(jsonObj[0]).map(k=>k.toUpperCase());
        var keys = Object.keys(jsonObj[0]);
        var ids = _.uniq(jsonObj.map(j => j[keys[keys_uppercase.indexOf('SAMPLEID')]]));
        ids = ids.map(id=>id.replace('tcga-', ''));         
        ids = ids.map(id=>id.replace('TCGA-', ''));
        var genes = _.uniq(jsonObj.map(j => j[keys[keys_uppercase.indexOf('GENE')]]));
        var mutTypes = _.uniq(jsonObj.map(j => j[keys[keys_uppercase.indexOf('TYPE')]]));
        var values = jsonObj.map((d)=>{
            return(ids.indexOf(d[keys[keys_uppercase.indexOf('SAMPLEID')]].replace('tcga-', '')) + '-' +
                   genes.indexOf(d[keys[keys_uppercase.indexOf('GENE')]]) + '-' +
                   mutTypes.indexOf(d[keys[keys_uppercase.indexOf('TYPE')]]));
        });
        obj.name = 'mutations';
        obj.type = 'mut';
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
                var result = serialization(jsonObj, file);
                var type = file.split('-')[0].toUpperCase();
                if (type === 'EVENT') {
                    events.push(result);
                } else {
                    data.push(result);
                    console.log('*****', result.type);
                    var jsonFileName = 'tcga_brain_' + result.name.replace(' ', '_') + '.json.gz';
                    console.log('jsonFileName: ', jsonFileName);
                    meta['name'] = result.name;
                    meta['dataType'] = result.name.replace(' ', '_');
                    meta['file'] = jsonFileName.replace('.gz','');
                    uploadResults.push(meta);
                    jsonfile.writeFile(meta['file'], result.res, function(err){
                        console.error(err);
                        console.log(file + '.json is saved.');
                    });
                    // var buf = new Buffer(JSON.stringify(result), 'utf-8');
                    // zlib.gzip(buf, level=9, function(err, result){
                    //     jsonfile.writeFile(jsonFileName, result, function(err) {
                    //         console.error(err);
                    //     });
                    // });
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
                obj.type = 'events';
                obj.name = 'events';
                var o = {};
                var m = {};
                var v = [];
                events.forEach(e=> {
                    m[e.res.map.subCategory] = e.res.map.category;
                    v = v.concat(e.res.values);
                });
                var type_keys = Object.keys(m);
                v.forEach(elem => elem[1] = type_keys.indexOf(elem[1]));
                o.map = m;
                o.values = v;
                obj.res = o;
                data.push(obj);
                jsonfile.writeFile('tcga_brain_events.json.json', obj, function(err){
                    console.error(err);
                    console.log('events.json is saved.');
                });
                var jsonFileName = 'tcga_brain_events.json.gz';
                meta['name'] = obj.name;
                meta['dataType'] = obj.name.replace(' ', '_');
                meta['file'] = jsonFileName.replace('.gz','');
                uploadResults.push(meta);

                var manifest = serialize.manifest(data, uploadResults);
                jsonfile.writeFile('manifest.json', manifest, function(err){
                    console.error(err);
                    console.log('manifest is saved.');
                });

                // var buf = new Buffer(JSON.stringify(obj), 'utf-8');
                // zlib.gzip(buf, level=9, function(err, result){
                //     jsonfile.writeFile(jsonFileName, result, function(err) {
                //         console.error(err);
                //     });
                // });
            } 
        }
      );
});

/* gzip file

var jsonFiles = [];
fs.readdir(".", (err, files) => {
    jsonFiles = files.filter(f => f.indexOf('tcga_brain_') > 0);
});
[ 'tcga_brain_clinical.json',
  'tcga_brain_events.json',
  'tcga_brain_gistic.json',
  'tcga_brain_gistic_threshold.json',
  'tcga_brain_mutations.json',
  'tcga_brain_psmap.json',
  'tcga_brain_rna.json']
  const zlib = require('zlib');
  var gzip = zlib.createGzip({
      level: 9 // maximum compression
  }), buffers=[], nread=0;
  
  var r = fs.createReadStream('./tcga_brain_mutations.json');
  var w = fs.createWriteStream('./tcga_brain_mutations.json.gz');
  r.pipe(gzip).pipe(w);
*/

/* region re-populate lgg_mut and gbm_mut
const json2csv = require('json2csv').parse;
const jsonfile = require('jsonfile');
const mutationType = {
    1: 'Missense',
    2: 'Silent',
    4: 'Frame_Shift_Del',
    8: 'Splice_Site',
    16: 'Nonsense_Mutation',
    32: 'Frame_Shift_Ins',
    64: 'RNA',
    128: 'In_Frame_Del',
    256: 'In_Frame_Ins',
    512: 'Nonstop_Mutation',
    1024: 'Translation_Start_Site',
    2048: 'De_novo_Start_OutOfFrame',
    4096: 'De_novo_Start_InFrame',
    8192: 'Intron',
    16384: '3\'UTR',
    32768: 'IGR',
    65536: '5\'UTR',
    131072: 'Targeted_Region',
    262144: 'Read-through',
    524288: '5\'Flank',
    1048576: '3\'Flank',
    2097152: 'Splice_Site_SNP',
    4194304: 'Splice_Site_Del',
    8388608: 'Splice_Site_Ins',
    16777216: 'Indel',
    33554432: 'R'
 };

var gbm_mut = require("./tcga_gbm_mut.json")
var lgg_mut = require("./tcga_lgg_mut.json")

var mut_reverse = function(mut){
    var arr = [];
    var ids = mut.ids;
    var genes = mut.genes;
    mut.values.forEach(m => {
        var obj = {};
        var sampleId = 'tcga-' + ids[m.split('-')[1]];
        var gene = genes[m.split('-')[0]];
        var type = mutationType[m.split('-')[2]];
        obj['sampleId'] = sampleId;
        obj['gene'] = gene;
        obj['type'] = type;
        arr.push(obj);
    });
    return arr;
};
lgg_mut_rev = mut_reverse(lgg_mut);
gbm_mut_rev = mut_reverse(gbm_mut);

jsonfile.writeFile("gbm_mut_rev.json", gbm_mut_rev, function(err) {
    console.error(err);
});
jsonfile.writeFile("lgg_mut_rev.json", lgg_mut_rev, function(err) {
    console.error(err);
});
json2csv -i lgg_mut_rev.json -o lgg_mut.csv
json2csv -i gbm_mut_rev.json -o gbm_mut.csv

 regionend */
