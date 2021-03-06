let mongoose = require('mongoose');
let logger = require('../services/logger.js');

module.exports = app => {

    let api = {};

    let model = mongoose.model('Transaction');

    api.list = (req, res) => {
        let teamID = req.params.team;
        let sprintID = req.params.sprint;
        model.aggregate(
            [
                {
                    $match: {
                        'sprint': mongoose.Types.ObjectId(sprintID),
                        'team': mongoose.Types.ObjectId(teamID),
                        'status': {
                            $in: [null, 0, 3] //NORMAL OR ACCEPTED
                        },
                    }
                },
                {
                    $group:
                    {
                        _id: "$to",
                        totalAmount: { $sum: "$amount" },
                        to: { $first: '$to' },
                        count: { $sum: 1 }
                    }
                }

                , {
                    $lookup:
                    {
                        from: "users",
                        localField: "to",
                        foreignField: "_id",
                        as: "user"
                    }
                }

            ]
        )
            .sort({ totalAmount: -1 })
            .then((ranking) => {

                let position = 1;
                //Removing passwords and fixing arrays
                let retRanking = ranking;
                retRanking.map((rankk) => {
                    rankk.user = rankk.user[0];
                    delete rankk.user.password;
                    delete rankk.to;
                    rankk.position = position++;
                });

                res.json(retRanking);
            }, (error) => {
                console.log(error);
                logger.error(error);
                res.sendStatus(500);
            });
    };

    return api;
};

