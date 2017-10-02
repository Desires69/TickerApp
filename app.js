var express = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    getcountSL = require('./getcount_sl');

var db = mongoose.connect('mongodb://localhost/tickerAPI',{useMongoClient: true});

var Ticker = require('./models/tickerModel');


var app = express();
var port = process.env.port || 3000;
app.use(function (req, res, next) {
    
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
    
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    
        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);
    
        // Pass to next layer of middleware
        next();
});    
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
const adminNav = [{
        Link: '/admin/countUpdate',
        Text: 'Update'
        }];
app.set('views', './src/views');
app.set('view engine', 'ejs');

const tickerRouter = require('./Routes/tickerRoutes')(Ticker);
const adminRouter = require('./Routes/adminRoutes')(Ticker, adminNav);

app.use('/api', tickerRouter);
app.use('/admin', adminRouter);


app.get('/', function(req, res){
    res.render('index');
});

app.listen(port, function(){
    console.log('Gulp is running my app on Port: ' + port);
});
getcountSL();
setInterval(getcountSL, 1800000);