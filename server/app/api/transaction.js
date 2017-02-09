let mongoose = require('mongoose');
let logger = require('../services/logger.js');

module.exports = app => {

    let api = {};

    let model = mongoose.model('Transaction');

    api.listByUser = (req, res) => {
        let user = req.params.user;
        let team = req.params.team;
        let sprint = req.params.sprint;
        model.find({
            $or: [
                { 'to': user },
                { 'from': user }
            ],
            'team': team,
            'sprint': sprint
        })
            .sort({ date: -1 })
            .populate('to from sprint transactionType team')
            .then((transactions) => {
                res.json(transactions);
            }, (error) => {
                logger.error(error);
                res.sendStatus(500);
            });

    };

    api.insert = (req, res) => {
        model.create(req.body)
            .then((transaction) => {
                model.findOne({
                    _id: transaction._id,
                })
                    .populate('to from sprint transactionType team')
                    .then((transaction) => {
                        // Sending transaction through socket.io
                        app.get('redis').get("user:" + transaction.to._id, (err, socketId) => {
                            if (err) {
                                logger.error('Error in getting socketId from Redis');
                            } else {
                                let socket =  app.get('io').sockets.connected[socketId];
                                if(typeof socket != "undefined"){
                                    socket.emit('transaction', transaction);
                                }
                            }
                        });
                        res.json(transaction);
                    }, (error) => {
                        logger.error(error);
                        res.sendStatus(500);
                    });
            }, (error) => {
                logger.error('cannot insert transaction');
                logger.error(error);
                res.sendStatus(500);
            });
    };


    //calm down litle grasshoper. This dont work...yet!
    api.valueDonated = (req, res) => {
        let user = req.params.user;
        let team = req.params.team;
        let sprint = req.params.sprint;
        model.aggregate([
            { $match: { $or: [{ to: user }, { from: user }], team: team, sprint: sprint } },
            { $group: { from: user, total: { $sum: "$amount" } } },
            { $group: { to: user, total: { $sum: "$amount" } } }
        ]);
    }

    return api;
};