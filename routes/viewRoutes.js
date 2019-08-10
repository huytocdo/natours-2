const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/me', authController.protectWeb, viewController.getAccount);
router.get('/my-tours', authController.protectWeb, viewController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protectWeb,
  viewController.updateUserData
);
module.exports = router;
