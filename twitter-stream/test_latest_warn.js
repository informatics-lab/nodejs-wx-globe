var mydb = require('./database');
var met = require('./met_warnings');

mydb.mongoClient.start();

function retrieve_latest(){

  if(mydb.mongoClient.db){
    var d = new Date();
    var collection_name = d.toJSON().substr(0,7)+"_uk_warn";
    // Get the most recent N items.
    var N = 1;
    var cursor = mydb.mongoClient.db.collection(collection_name).find().sort({$natural:-1}).limit(N);
    var n = 0;
    cursor.each(function(err, doc) {
      if (doc != null) {
        console.dir(doc.rss.channel);
        console.log(doc.rss.channel[0].pubDate);
        console.log("RECORD : ", n);
        n += 1;
        doc.rss.channel[0].item.forEach(function(i){
          //console.dir(i);
          console.log(i.pubDate);
          console.log("--------");
        });
      }
    mydb.mongoClient.db.close();
    });

    //mydb.mongoClient.insert("test",{"hello":"world"});
    //mydb.mongoClient.collections(function(arr){
    //  console.log("collections", arr);
    //});
    //console.log(mydb.mongoClient.stop());
  }
  else{
    console.log("trying again in 3 secs...");
    setTimeout(function(){retrieve_latest()}, 3000);
  }
}

retrieve_latest();
