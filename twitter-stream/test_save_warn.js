var mydb = require('./database');
var met = require('./met_warnings');

mydb.mongoClient.start();

function fetch_and_save_warning(){

  if(mydb.mongoClient.db){
    met.metWarnings.getUK(function(data){
      console.log(data);
      var d = new Date();
      var collection_name = d.toJSON().substr(0,7)+"_uk_warn";
      mydb.mongoClient.insert(collection_name,data);
      console.log(mydb.mongoClient.stop());
    });

    //mydb.mongoClient.insert("test",{"hello":"world"});
    //mydb.mongoClient.collections(function(arr){
    //  console.log("collections", arr);
    //});
    //console.log(mydb.mongoClient.stop());
  }
  else{
    console.log("trying again in 3 secs...");
    setTimeout(function(){fetch_and_save_warning()}, 3000);
  }
}

fetch_and_save_warning();
