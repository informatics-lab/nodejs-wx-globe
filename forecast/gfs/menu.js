/* fetch_gfs.js
 */

var fs = require('fs'),
  http = require('http'),
  request = require('request'),
  xml2js = require('xml2js'),
  util = require('util');

var parser = new xml2js.Parser();

var GfsMenu = {};

function getCapabilities(wmsUrl, callback){

  request({
    url: wmsUrl,
    qs: {
      version: '1.3.0', service: 'WMS', request: 'GetCapabilities'
    }
  }, function(err, res, body){
          callback(body, wmsUrl);
  });
}

function getPNG(layer, outname){
  request({

    url: 'http://wms-wetoffice.rhcloud.com/iblgfs',
    encoding: null,  // returns body as binary buffer rather than string
    qs: {
      layers: layer,
      version:'1.3.0', service:'WMS', request:'GetMap',
      //styles: 'default',
      crs: 'CRS:84',
      bbox: '-180,-90,180,90',
      width: '2048',
      height: '1024',
      format: 'image/png'
      }
    },
    function(err, res, body){
      var wstream = fs.createWriteStream(outname);
      wstream.write(body);
      wstream.end();
    }
  );
}

function parseCapabilities(data, wmsUrl){
  var menu = [];
  parser.parseString(data, function (err, result) {
      //console.log(util.inspect(result, false, null));
      //console.log(JSON.stringify(result, null, '\t'));
      var allcap = result.WMS_Capabilities.Capability[0].Layer[0];
      allcap.Layer.forEach(function(el){
        el.Layer.forEach(function(l){
          menu.push([l.Name[0],l.Title[0]]);
          var layer = "temperature";
          var re = new RegExp("^"+layer+"$","g");
          //if (/^temperature$/g.test(l.Name)){
          if(re.test(l.Name)){
            //console.log(util.inspect(l.Dimension, false, null));
            var dimensions = {}
            l.Dimension.forEach(function(d){
              //console.log('D_', d['_']);
              //console.log('name', d['$']['name']);
              dimensions[d['$']['name']] = d['_'].split(',');
              //console.log('default', d['$']['default']);
            });
            //console.log(dimensions);
            var styles = {}
            l.Style.forEach(function(s){
              styles[s['Name'][0]] = s['Title'][0];
            });
            //console.log(styles);
          }

        });
      });
  });
  return ({server:wmsUrl,layers:menu})
}

// 'https://ogcie.iblsoft.com/ncep/gfs',
var wmsUrl = 'https://wms-wetoffice.rhcloud.com/iblgfs';

GfsMenu.fetch = function(req, callback){
  getCapabilities(wmsUrl, function(body, wmsUrl){
  menu = parseCapabilities(body, wmsUrl);
  callback(menu);
  });
}

module.exports = GfsMenu;
