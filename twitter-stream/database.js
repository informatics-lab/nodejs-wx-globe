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
      var collections = {};
      if(err){
        callback({});
      }
       items.forEach(function(i){
         i.count(function(err,count){
           collections[i.s.name] = count;
           //console.log(i.s.name, count)
         });
         //collections.push(i.s.name);
       });
       callback(collections);
    });
  }else{
    console.log("collections - no db");
    callback({});
  }
}

var publishInterval, scanInterval;

var stats = {};

statsPublisher.start = function() {
  var response = {};
  if (scanInterval) {
    clearInterval(scanInterval);
  }

  scanInterval = setInterval(function () {
      mongoClient.collections( function(collections){
        stats.collections = collections;
        //collections.forEach(function(c){
        //  stats.collections[c] = {};
        //});
      } );
  }, 20000);  // every 20 seconds.




  // Clear publish interval just be sure they don't stack up (probably not necessary)
  if (publishInterval) {
    clearInterval(publishInterval);
  }
  // Only publish every 100 millseconds so that the browser view is not overloaded
  publishInterval = setInterval(function () {
      publishStats();
  }, 100);
  response.message = "database stats publishing on.";
  return response;
}

function publishStats () {
	if(statsPublisher.socket){
  	statsPublisher.socket.volatile.emit('volatile msg', {stats: stats});
	}
}


module.exports = {mongoClient:mongoClient, statsPublisher:statsPublisher};
