var express = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    getcountSL = require('./getcount_sl');

var db = mongoose.connect('mongodb://localhost/tickerAPI',{useMongoClient: true});

var Ticker = require('./models/tickerModel');


var app = express();
var port = process.env.port || 3000;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

const tickerRouter = require('./Routes/tickerRoutes')(Ticker);


app.use('/api', tickerRouter);



app.get('/', function(req, res){
    res.send('Welcome to my API!');
});

app.listen(port, function(){
    console.log('Gulp is running my app on Port: ' + port);
});
getcountSL();
setInterval(getcountSL, 1800000);