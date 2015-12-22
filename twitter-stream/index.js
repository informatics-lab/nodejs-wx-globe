var Twit = require('twit');
var mydb = require('./database');
var met = require('./met_warnings');

TweetPublisher = {
	mongoClient: mydb.mongoClient,
	statsPublisher: mydb.statsPublisher,
	metWarnings: met.metWarnings};

// $ rhc env list -a socket

var twitter = TweetPublisher.twitter = new Twit({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token: process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret: process.env.TWITTER_TOKEN_SECRET
});

var tv_weather=["3510235395","2485531140","2413164115","2356286514","2247356916","1392425179","1358157889",
"994315261","899895482","755860369","554413809","486468583","485349069","466147209","437009630","412366839",
"378851883","359525994","357067267","351915951","347408308","331671838","314536509","311870782","309929507",
"304923811","293750778","291161196","290180065","285599020","278173042","271483634","271367329","263685349",
"257573181","252789303","239883604","238275015","236585963","230055446","228874251","228540081","209176621",
"177569765","168267357","167324927","152696429","145538207","144486882","142671996","140975035","132849944",
"131463652","118079990","110440650","104964424","95887133","93306677","86310172","84250783","84194879",
"76299844","58203491","55515169","43670834","41418291","39192220","39079092","38226468","32567081",
"29980664","28097850","26213879","26207922","24817486","24737068","24440724","24081172","23749172",
"22762908","22363437","22356817","22215485","21620393","21481785","21388284","21232507","21071759",
"20682357","20677839","20557363","20481072","19855459","19715773","19501531","17439820","16545002",
"16007369","15865717","15804945","15309804","14604185"];


var stream, cachedTweet, publishInterval;

/**
 * Starts Twitter stream and publish interval
 */
TweetPublisher.start = function () {

	var response = { };

	// If the stream does not exist create it
	if (!stream) {
		stream = twitter.stream('statuses/filter', { follow: tv_weather });
		stream.on('tweet', function (tweet) {
			cachedTweet = tweet;
			var d = new Date();
			var collection_name = d.toJSON().substr(0,10);
			TweetPublisher.mongoClient.insert(collection_name, tweet);
		});

		response.message = 'Stream created and started.'
	}
	// If the stream exists start it
	else {
		stream.start();
		response.message = 'Stream already exists and started.'
	}

	// Clear publish interval just be sure they don't stack up (probably not necessary)
	if (publishInterval) {
		clearInterval(publishInterval);
	}

	// Only publish a Tweet every 100 millseconds so that the browser view is not overloaded
	// This will provide a predictable and consistent flow of real-time Tweets
	publishInterval = setInterval(function () {
		if (cachedTweet) {
			publishTweet(cachedTweet);
		}
	}, 1000); // Adjust the interval to increase or decrease the rate at which Tweets sent to the clients

	return response;
}

/**
 * Stops the stream and publish interval
 **/
TweetPublisher.stop = function () {

	var response = { };

	if (stream) {
		stream.stop();
		clearInterval(publishInterval);
		response.message = 'Stream stopped.'
	}
	else {
		response.message = 'Stream does not exist.'
	}

	return response;
}

var lastPublishedTweetId;

TweetPublisher.setSocket = function( socket ) {
	TweetPublisher.socket = socket;
	TweetPublisher.statsPublisher.socket = socket;
}

function publishTweet (tweet) {

	if (tweet.id == lastPublishedTweetId) {
		return;
	}

	lastPublishedTweetId = tweet.id;

	if(TweetPublisher.socket){
  	TweetPublisher.socket.volatile.emit('volatile msg', {tweet: tweet});
	}
}


module.exports = TweetPublisher;
