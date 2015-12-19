var request = require('request');
var xml2js = require('xml2js');
var mydb = require('./database');
var warnings_url = "http://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/UK";

metWarnings = {};

var parser = new xml2js.Parser({attrkey:'attr'});  // default is '$'

metWarnings.getUK = function(callback){
	request(warnings_url, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			parser.parseString(body, function(err, data) {
				//console.log(JSON.stringify(data, null, 2));
				callback(data);
			});
			//}else{
			//    console.log("ERROR");
			//}
		}
	});
}

metWarnings.fetch = function(){
	var response = {};
	var d = new Date();
	metWarnings.getUK(function(data){
      var collection_name = d.toJSON().substr(0,7)+"_uk_warn";
      mydb.mongoClient.insert(collection_name,data);
    });
	response.message = "UK weather warnings fetched at " + d;
	return response;
}

module.exports = {metWarnings:metWarnings};
