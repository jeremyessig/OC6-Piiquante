const Sauce = require('../models/Sauce');
const fs = require('fs');
const { find, findById } = require('../models/Sauce');

/**
 * Renvoie toutes les sauces
 * Fonctionnel
 */
exports.getAllSauces = async (req, res) => {
    try {
        let allSauces = await Sauce.find();
        res.status(200).json(allSauces);

    } catch (error) {
        res.status(500).json(error);
    }
}


// Utilisateur créée une nouvelle sauce
exports.createSauce = async (req, res) => {
    console.log("Création d'une nouvelle sauce");
    const sauceObject = JSON.parse(req.body.sauce);
    const newSauce = new Sauce({
        ...sauceObject,
        dislikes: 0,
        likes: 0,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    try {
        const savedSauce = await newSauce.save();
        res.status(200).json(savedSauce);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}


exports.modifySauce = async (req, res) => {
    let sauceObject = null;

    // Si une nouvelle images est ajoutée, on supprime l'ancienne du dossier images
    if (req.file) {
        sauceObject = {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        }
        try {
            // On récupère le chemin de l'ancienne image
            const oldSauce = await Sauce.findById({ _id: req.params.id });
            const filename = oldSauce.imageUrl.split('/images/')[1];
            // On supprime l'ancienne image du dossier
            fs.unlink(`images/${filename}`, (err) => {
                if (err) {
                    console.log(err)
                }
            });
        } catch (error) {
            res.status(400).json(error);
        }
        // Si l'image n'est pas modifiée, on conserve la même image
    } else {
        sauceObject = { ...req.body };
    }

    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Objet modifié !' }))
        .catch(error => res.status(400).json({ error }));
};


//Suppression d'une sauce
exports.deleteSauce = (req, res) => {
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
            // Suppression de l'image associée
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
exports.getSauceById = async (req, res) => {
    try {
        const sauce = await Sauce.findById(req.params.id);
        res.status(200).json(sauce);
    } catch (error) {
        res.status(500).json(error);
    }
}

//Gestion des likes et des dislikes
exports.setLikes = async (req, res) => {
    try {

        let like = req.body.like;
        let userId = req.body.userId;
        let sauceId = req.params.id;

        // Ajout d'un like
        if (like === 1) {
            try {
                // On récupère la sauce et on ajoute l'utilisateur dans le tableau et on incérmente le like
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

        // Ajout d'un dislike
        if (like === -1) {
            try {
                // On récupère la sauce et on ajoute l'utilisateur dans le tableau et on incérmente le dislike
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
                // On récupère la sauce, on supprime'utilisateur s'il existe dans le tableau et on décrémente le like
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
                // On supprime'utilisateur s'il existe dans le tableau et on décrémente le dislike
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