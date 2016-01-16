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

function parseCapabilities(data, query){
  var layer = query["layer"];
  var menu = [];
  var selection = {};
  parser.parseString(data, function (err, result) {
      if(err){
        console.log("menu.js", err);
        return({});
      }
      var allcap;
      var allcap = result.WMS_Capabilities.Capability[0].Layer[0];
      console.log("allcap", allcap);
      allcap.Layer.forEach(function(el){
        el.Layer.forEach(function(l){
          menu.push([l.Name[0],l.Title[0]]);
          // This matches only exact strings, ignoring case.
          // Change this to give substring match or similar,
          // but this can result in multiple selections being
          // returned.
          var re = new RegExp("^"+layer+"$","gi");
          if(re.test(l.Name[0])){
            selection[l.Name[0]] = {}
            var dimensions = {}

            if(l.Dimension){
              l.Dimension.forEach(function(d){
                dimensions[d['$']['name']] = d['_'].split(',');
                dimensions[d['$']['name']].forEach(function(el,idx,arr){
                  // Remove any whitespace characters. This is probably
                  // the correct thing to do. If not try removing
                  // leading & trailing whitespace.
                  arr[idx] = el.replace(/\s/g,'');
                });
              });
              selection[l.Name[0]].dimensions = dimensions;
            }
            var styles = {}
            if(l.Style){
              l.Style.forEach(function(s){
                styles[s['Name'][0]] = s['Title'][0];
              });
              selection[l.Name[0]].styles = styles;
            }
          }

        });
      });
  });
  result = {};
  result.server = wmsUrl;
  result.layers = menu;
  result.selection = selection;
  return (result)
}

// 'https://ogcie.iblsoft.com/ncep/gfs',
var wmsUrl = 'https://wms-wetoffice.rhcloud.com/iblgfs';


GfsMenu.fetch = function(req, callback){
  console.log("FETCH MENU");
  console.log(req.query);
  wmsUrl = "http://" + req.route.params[0];
  getCapabilities(wmsUrl, function(body, wmsUrl){
    menu = parseCapabilities(body, req.query);
    callback(menu);
  });
}

module.exports = GfsMenu;
