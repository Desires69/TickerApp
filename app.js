var express = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    getcountSL = require('./getcount_sl');

var db = mongoose.connect('mongodb://localhost/tickerAPI',{useMongoClient: true});

var Ticker = require('./models/tickerModel');


var app = express();
var port = process.env.port || 3000;
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