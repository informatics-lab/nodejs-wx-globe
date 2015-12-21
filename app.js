#!/bin/env node
//  My OpenShift Node application
var express = require('express');
var fs      = require('fs');
var request = require('request');
var tweetPublisher = require('./twitter-stream');
var mongoClient = tweetPublisher.mongoClient;
var statsPublisher = tweetPublisher.statsPublisher;
var metWarnings = tweetPublisher.metWarnings;


var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        //self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.ipaddress = "0.0.0.0";
        //self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8000;
        self.port      = process.env.PORT || 8000;
        // My fix for OpenShift/local websocket port.
        // Requires that WEBSOCKET_PORT is set to 8000.
        //var appdns = process.env.OPENSHIFT_APP_DNS || "localhost";
        //var appdns = "wxglobe.elasticbeanstalk.com";
        //var ws_port    = process.env.WEBSOCKET_PORT || 8000;
        //var ws_port=80;
        //self.websocket = "http://" + appdns + ":" + ws_port + "/";
        self.websocket = process.env.WEBSOCKET || "http://localhost:8000/"
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */

    self.createRoutes = function() {
        self.routes = { };

        self.routes['/env'] = function(req, res) {
            res.send("<html><body>" + JSON.stringify(process.env) + "</body></html>");
        };

        self.routes['/stream/start'] = function(req, res) {
            res.send( tweetPublisher.start() );
        };

        self.routes['/stream/stop'] = function(req, res) {
            res.send( tweetPublisher.stop() );
        };

        self.routes['/mongo/start'] = function(req, res) {
            res.send( mongoClient.start() );
        };

        self.routes['/mongo/stop'] = function(req, res) {
            res.send( mongoClient.stop() );
        };

        self.routes['/stats/start'] = function(req, res) {
            res.send( statsPublisher.start() );
        };

        self.routes['/stats/stop'] = function(req, res) {
            res.send( statsPublisher.stop() );
        };

        self.routes['/warnings/fetch'] = function(req, res) {
            res.send( metWarnings.fetch() );
        };


        self.routes['/websocket_init.js'] = function(req, res) {
          res.send('var websocket = io.connect("' + self.websocket + '");');
        };
        self.routes['/location'] = function(req, res) {
          var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
          request("https://freegeoip.net/json/" + ip, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              res.send(body);
            }else{
              res.send(ip);
            }
          });
        }
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
        // set the static files location /public/img will be /img for users
        self.app.use(express.static(__dirname + '/public'));

    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        //self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };

    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).

        self.server = require('http').Server(self.app);
        self.io = require('socket.io')(self.server);
        self.io.on('connection', function (socket) {
          tweetPublisher.setSocket( socket );
          socket.emit('news', { hello: 'world' });
          /*
          var tweets = setInterval(function () {
            //getBieberTweet(function (tweet) {
              socket.volatile.emit('volatile msg', {tweet: 'some text B'});
            //});
            }, 100);
          */
          socket.on('my other event', function (data) {
            //console.log(data);
          });
          socket.on('disconnect', function () {
            //clearInterval(tweets);
          });
        });


        self.server.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();
