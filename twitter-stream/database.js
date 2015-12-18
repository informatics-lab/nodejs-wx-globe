// database.js
//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var mongoClient = {'interface': mongodb.MongoClient, 'db':undefined};

var statsPublisher = {};

// Connection URL. This is where your mongodb server is running.
// For local testing use port forwarding.
var url = process.env.OPENSHIFT_MONGODB_DB_URL;

mongoClient.start = function(){
  var response = {message: "db started." };
  this.interface.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
	mongoClient.db = db.db("twitter");
      // To close connection call db.close();
    }
  });
  return response;
}

mongoClient.stop = function(){
  var response = {};
  if(mongoClient.db){
    mongoClient.db.close();
    mongoClient.db = undefined;
    response.message = "db closed.";
  }
  response.message = "no db.";
  return response;
}

mongoClient.insert = function(collection_name, item){
  //console.log("inserting in", collection_name);
  if(mongoClient.db){
    var collection = mongoClient.db.collection(collection_name);
    collection.insert([item], function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log('Inserted %d documents. The documents inserted are:', result.result.n, result);
      }
    });
  }else{
    console.log("No db");
  }
}

mongoClient.collections = function(callback){
  if(mongoClient.db){
    mongoClient.db.collections(function(err, items) {
      var collections = [];
       items.forEach(function(i){
         i.count(function(err,count){console.log(count)});
         collections.push(i.s.name);
       });
       callback(collections);
    });
  }else{
    callback([]);
  }
}

module.exports = {mongoClient:mongoClient, statsPublisher:statsPublisher};
