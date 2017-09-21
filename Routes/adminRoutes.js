var express = require('express');
var adminRouter = express.Router();

var router = function(Ticker, nav){
    
    adminRouter.route('/')
        .get(function(req,res){
            var query = {};
            var limit = parseInt(req.query.limit) || 10;

            Ticker.find().sort('-updated').limit(limit).exec(function(err, tickers){
                if(err){
                    console.log(err);
                }else{
                    res.render('admin',{
                        title: 'Admin main',
                        nav: nav,
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
                        nav: nav,
                        recentCounts: tickers
                    });
                }
            });
        });
    adminRouter.route('/setCount/:id')
        .post(function(req,res){
            console.log(req.body + ' ' + req.params.id);
            Ticker.findById(req.params.id, function(err, tickers){
                if(err){
                    res.status(500).send(err);
                    console.log(err);
                }else if(tickers){
                    if(req.body.count){
                        tickers.count = req.body.count;
                        tickers.save(function(err){
                            if(err){
                                res.status(500).send(err);
                            }else{
                                res.redirect('/admin/countUpdate');
                            }
                        });
                    }else{
                        res.status(500).send('No count in body');
                    }
                }else{
                    res.status(404).send('No entry found');
                }
            });
        });

    return adminRouter;
};

module.exports = router;