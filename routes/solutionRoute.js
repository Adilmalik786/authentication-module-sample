const express = require("express");
const router = express.Router();
const authController = require('../controller/authController');
const solutionController = require('../controller/solutionController')


router.post('/', authController.protect, authController.restrictTo('admin','dataentry','qa'), solutionController.addSolution);
router.get('/', solutionController.getSolutionQuestions);


router.post('/initiate-checkout/:slug', solutionController.initiateCheckout);

router.get('/:slug', solutionController.getSingleSolution);


module.exports = router;
