var express = require('express');
var adminRouter = express.Router();

var router = function(Ticker){
    
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
    adminRouter.route('/lastLogin')
        .get(function(req, res){
            var query = {}
            Ticker.findOne().sort('-updated').exec(function(err, tickers){
                if(err){
                    console.log(err);
                }else{
                    res.json(tickers);
                }
            });
        });
    adminRouter.route('/setCount')
        .patch(function(req,res){
            Ticker.findOne().sort('-updated').exec(function(err, tickers){
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
                                res.json(tickers);
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