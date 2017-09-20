var express = require('express');
var adminRouter = express.Router();

var router = function(Ticker){
    
    adminRouter.route('/')
        .get(function(req,res){
            var query = {};
            if (req.query.count){
                query.count = req.query.count;
            }
            Ticker.find(query, function(err, tickers){
                if(err){
                    console.log(err);
                }else{
                    res.render('admin',{
                        title: 'Admin main',
                        recentCounts: tickers
                    });
                }
            });

            
        });
    adminRouter.route('/recentLogins')
        .post(function(req,res){
            var ticker = new Ticker(req.body);
            console.log(ticker);
            ticker.save();
            res.status(201).send(ticker);
        })
        .get(function(req, res){
            var query = {};
            if (req.query.count){
                query.count = req.query.count;
            }
            Ticker.find(query, function(err, tickers){
                if(err){
                    console.log(err);
                }else{
                    res.json(tickers);
                }
            });
        });
    adminRouter.route('/countUpdate')
        .get(function(req, res){
            var query = {}
            Ticker.findOne().sort('-updated').exec(function(err, tickers){
                if(err){
                    console.log(err);
                }else{
                    res.render('countUpdate',{
                        title: 'Admin update',
                        recentCounts: tickers
                    });
                }
            });
        });
    adminRouter.route('/setCount')
        .post(function(req,res){
            console.log(req.body)
        });

    return adminRouter;
};

module.exports = router;