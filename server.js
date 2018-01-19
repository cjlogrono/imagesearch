var express = require('express');
var mongodb = require('mongodb');
var assert = require('assert');
var request = require('request');

var app = express();

var MongoClient = mongodb.MongoClient;


var uri = 'mongodb://cjlogrono:incorrect@ds137686.mlab.com:37686/freecodecamp';

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
app.set('json spaces', 10);

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/history", function (req, res){

  MongoClient.connect(uri, function (err, db) {
        
    assert.equal(null, err);
    db.collection('history').find({}, {_id:0}).toArray(function(err, doc) {
            
        assert.equal(null, err);  
        db.close();
        res.json(doc);
    });
  });
});

app.get("/search", function(req, res){
  
  res.end("To search for image please add a backslash (/) and the keywords to be searched for in the current url\r\n"+
          "Example: https://imagesearchabstract.glitch.me/search/donut\r\n\r\nYou can also add a offset query to specify the number of results to output\r\n"+
          "Example: https://imagesearchabstract.glitch.me/search/donut?offset=11");
});

app.get("/search/:searchVal", function(req, res){
  
  var offset = req.query.offset;
  var keyword = req.params.searchVal;
  var url = "";
  
  if (offset)
      url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyBE_Rf3PQtMegVA5f8xXYaO0ZDqLP0zDqs&cx=011127744897822448224:e_5e2yz9cwy&searchType=image&q=' + keyword + '&start=' + offset;
  else
      url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyBE_Rf3PQtMegVA5f8xXYaO0ZDqLP0zDqs&cx=011127744897822448224:e_5e2yz9cwy&searchType=image&q=' + keyword;
  
  var requestObject = {

      uri: url,
      method: 'GET',
      timeout: 10000

  };

  request(requestObject, function(error, response, body) {

      if (error)
        throw (error);
      else {
        
        //console.log(body);
        //save date and query in database first  

        var d = new Date();

        var date = d.toJSON();

        var query = {

          "term": keyword,
          "time": date
        };
        
        MongoClient.connect(uri, function (err, db) {
        
          assert.equal(null, err);
          db.collection('history').insert(query, function(err, result) {
  
              assert.equal(null, err);
              db.close();
              console.log('Inserted %d documents into the imagequeries collection. The documents inserted with "_id" are:', result.length, result);

          });
        });

       //construct the search results

        //array to hold the search result objects
        var array = [];

        //parse the body as JSON 
        var result = JSON.parse(body);
        //only use the items of the body, that is an array of search results objects
        var imageList = result.items;

        for (var i = 0; i < imageList.length; i++) {
        //loop through array of search result objects and construct an object of info we want to display. Push each object tp array    

          var image = "url: " + imageList[i].link +
            "\r\nsnippet: " + imageList[i].snippet +
            "\r\ncontext: " + imageList[i].displayLink + "\r\n\r\n";

          res.write(image);

        } 
        res.end("\r\n" + keyword + " " + offset);

      } 
  });     
  
});


app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  //the locals variable in res can be used in the error2 file
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
