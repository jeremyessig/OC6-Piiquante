const express = require('express');
const router = express.Router();
const sauceCtrl = require('../controllers/sauce');
const multer = require('../middleware/multer-config');
const auth = require('../middleware/auth');

router.get('/sauces', auth, sauceCtrl.getAllSauces);
router.post('/sauces', auth, multer, sauceCtrl.createSauce);
router.get('/sauces/:id', auth, sauceCtrl.getSauceById);
router.put('/sauces/:id', multer, sauceCtrl.modifySauce);
router.delete('/sauces/:id', auth, sauceCtrl.deleteSauce);
router.post('/sauces/:id/like', auth, sauceCtrl.setLikes);

module.exports = router;