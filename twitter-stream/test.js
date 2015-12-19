var mydb = require('./database');

mydb.mongoClient.start();

function shutdown(){
  console.log("trying...");
  if(mydb.mongoClient.db){
    mydb.mongoClient.insert("test",{"hello":"world"});
    mydb.mongoClient.collections(function(arr){
      console.log("collections", arr);
    });
    //console.log(mydb.mongoClient.stop());
  }
  else{
    setTimeout(function(){shutdown()}, 3000);
  }
}

setTimeout(shutdown(), 3000);
