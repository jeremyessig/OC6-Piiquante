const Sauce = require('../models/Sauce');
const fs = require('fs');

/**
 * Renvoie toutes les sauces
 * Fonctionnel
 */
exports.getAllSauces = async (req, res, next) => {
    try {
        let allSauces = await Sauce.find();
        res.status(200).json(allSauces);

    } catch (error) {
        res.status(500).json(error);
    }
}


// Utilisateur créer une nouvelle sauce
exports.createSauce = async (req, res, next) => {
    console.log("Création d'une nouvelle sauce");
    console.log(req.body.sauce);
    const sauceObject = JSON.parse(req.body.sauce);
    const newSauce = new Sauce({
        ...sauceObject,
        dislikes: 0,
        likes: 0,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    console.log(newSauce);
    try {
        const savedSauce = await newSauce.save();
        res.status(200).json(savedSauce);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}


exports.modifySauce = (req, res, next) => {
    console.log(req.body.sauce);
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Objet modifié !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id }).then(
        (sauce) => {
            if (!sauce) {
                res.status(404).json({
                    error: new Error('No such Sauce!')
                });
            }
            if (sauce.userId !== req.auth.userId) {
                res.status(403).json({
                    error: new Error('Unauthorized request!')
                });
            }
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => { res.status(200).json({ message: 'Deleted!' }) })
                    .catch((error) => { res.status(400).json({ error: error }) });
            });
        })
        .catch(error => res.status(500).json({ error }));
};


/**
 * Renvoie une sauce en fonction de son ID
 * Fonctionnel !
 */
exports.getSauceById = async (req, res, next) => {
    try {
        const sauce = await Sauce.findById(req.params.id);
        res.status(200).json(sauce);
    } catch (error) {
        res.status(500).json(error);
    }
}

exports.setLikes = async (req, res, next) => {
    try {
        // const sauce = await Sauce.findOne({ _id: req.params.id });
        // if (!sauce) {
        //     res.status(404).json({
        //         error: new Error('No such Sauce!')
        //     });
        // }

        let like = req.body.like;
        let userId = req.body.userId;
        let sauceId = req.params.id;

        console.log(userId);
        if (like === 1) {
            try {
                const sauceUpdate = await Sauce.updateOne(
                    {
                        _id: sauceId
                    },
                    {
                        $push: {
                            usersLiked: userId
                        },
                        $inc: {
                            likes: +1
                        }
                    }
                )
                res.status(200).json(sauceUpdate);
            } catch (error) {
                res.status(400).json(error);
            }

        }
        if (like === -1) {
            try {
                const sauceUpdate = await Sauce.updateOne(
                    {
                        _id: sauceId
                    },
                    {
                        $push: {
                            usersDisliked: userId
                        },
                        $inc: {
                            dislikes: +1
                        }
                    }
                )
                res.status(200).json(sauceUpdate);
            } catch (error) {
                res.status(400).json(error);
            }

        }

        if (like === 0) {
            try {
                const sauce = await Sauce.findOne({ _id: sauceId })
                if (sauce.usersLiked.includes(userId)) {
                    const sauceUpdate = await Sauce.updateOne(
                        {
                            _id: sauceId
                        },
                        {
                            $pull: {
                                usersLiked: userId
                            },
                            $inc: {
                                likes: -1
                            }
                        }
                    )
                    res.status(200).json(sauceUpdate);
                }
                if (sauce.usersDisliked.includes(userId)) {
                    const sauceUpdate = await Sauce.updateOne(
                        {
                            _id: sauceId
                        },
                        {
                            $pull: {
                                usersDisliked: userId
                            },
                            $inc: {
                                dislikes: -1
                            }
                        }
                    )
                    res.status(200).json(sauceUpdate);
                }
            } catch (error) {
                res.status(400).json(error);
            }
        }
    } catch (error) {
        res.status(500).json(error);
    }
}