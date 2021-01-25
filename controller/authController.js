const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');
const { promisify } = require('util');
const catchAsync = require('./errorController').catchAsync;
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const apiFeatures = require('../utils/apiFeatures');

const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)




const createUser = async (data) => {

  const user = new User({ ...data });

  //if user signup as a student
  if (data.role == 'student') {
    user.set({
      student: {
        freeQuestion: 0,
        interest: ""
      }
    });
    user.set({
      tutor: undefined
    })
  }
  //if user sign up a tutor
  else if (data.role == 'tutor') {
    user.set({
      tutor: {
        bidsRemaining: 10,
        createdAt: Date(),
        level: "1",
        tier: "silver",
        description: ""
      }
    });
  }

  //saving user data in database
  const result = await user.save();

  return result;
}

//Adding User
exports.createUser = catchAsync(async (req, res, next) => {

  const data = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    gender: req.body.gender,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  }
  const user = createUser(data)

  // create the token and send the response to the user
  createSendToken(user, 201, res);
});

//



exports.checkEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const emailExists = apiFeatures()
})


const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);


  const expiresIn = process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000;
  const cookieOptions = {
    // convert days to
    expires: new Date(Date.now() + expiresIn),
    httpOnly: true  // Browser will only receive the cookie and send it back. It will not update the cookie in any way
  }

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true   // The cookie should be sent over a secure https connection
  }

  // delete the password from the output
  user.password = undefined;
  user.active = undefined;


  res.cookie('jwt', token)

  res.status(statusCode).json({
    status: 'success',
    token,
    expiresIn,
    data: {
      user: user
    }
  })
}


exports.login = catchAsync(async (req, res, next) => {

  // fetch email and password from the body and save their value in the variables
  const { email, password } = req.body;

  // 1) Check if the email and password exist

  if (!email || !password) {
    // generate error that will be catched in our error handler
    return next(new AppError('Please Enter email and password', 400))
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); // this + sign is used when we want to select a field that is originally excluded from mongoose select in model

  if (!user) {
    return next(new AppError('Email does not exist', 404));
  }
  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Email or Password is incorrect', 401));
  }
  // 3) if everything is ok, send token to client

  // Create the jwt token and send the response back to user
  createSendToken(user, 200, res);
})

exports.protect = catchAsync(async (req, res, next) => {

  let token;

  // 1) Getting token and check if token exists
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please login to get access', 401));
  }

  // 2) Validate the verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWt_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError('The user you are trying to login does not exist', 401));

  // 4) Check if user changed password after the JWT token was issued
  if (currentUser.passwordChangeAfter(decoded.iat)) {
    return next(new AppError('The password has been changed after the user logged in and you are not authorized anymore', 401));
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
})


// function wrapper to return the middleware function but with the generated roles array
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log(req.user.role);
    console.log(roles);
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }

    next();
  }
}


exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted Email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }
  // 2) Generate the randomm reset token
  const resetToken = user.createPasswordResetToken(); //this method is just updating the fields on the user object but not actually saving it, so we have to save it saperately

  // Validate before save is turned off because we just want to update the user and not update the password
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email

  const resetURL = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`

  const message = `Forget your password? Submit a PATCH request with your new password and confirm
    password to: ${resetURL}. \nIf you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset your password (10 mins only)',
      template: __dirname + '/../utils/emails/forgotPassword.html',
      replacements: {
        name: "Ayyaz Ali",
        token: resetToken,
        host: process.env.HOST
      }

    })
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err)
    return next(new AppError('There was an error sending the email. Try again later!', 500))
  }

  res.status(200).json({
    status: 'success',
    message: 'Please check your email to reset your password'
  })

})

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  // find the user based on the hashed token and check if the expiry time is greater than the current time
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('The password reset token is not valid or has expired', 400))
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // 3) Update changePasswordAt property for the user
  user.passwordChangedAt = Date.now();
  await user.save();


  // 4) Log the user in, send JWT

  // Create the jwt token and send the response back to user
  createSendToken(user, 200, res);
})


exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user
  user = await User.findById(req.user.id).select('+password');
  // 2) Check if the Password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401))
  }

  // 3) Log user in, send jwt
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Create the jwt token and send the response back to user
  createSendToken(user, 200, res);
})



exports.googleLogin = catchAsync(async (req, res, next) => {

  // console.log(req.body.token)
  if (req.body.token) {
    const ticket = await client.verifyIdToken({
      idToken: req.body.token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { given_name, family_name, email, picture, sub } = ticket.getPayload();
    // console.log(ticket);

    // Check if user is already registered
    let user = await User.findOne({ email });
    const random = Math.random() + Date.now();
    if (!user) {
      console.log('creating new user');
      data = {
        firstName: given_name,
        lastName: family_name,
        email: email,
        oAuthProvider: 'google',
        oAuthSub: sub,
        password: random,
        passwordConfirm: random,
        role: 'student',
        image: picture
      }
      user = await createUser(data);
      // Send created response
      return createSendToken(user, 201, res);
    }

    // Update user image depending on google images if the image is not already set
    if (!user.image) {
      user.set({
        oAuthProvider: 'google',
        oAuthSub: sub,
        image: picture
      })
      user = await user.save({ validateBeforeSave: false });
    }
    // if the user is found then send the success token
    return createSendToken(user, 200, res);
  }
  res.status(401).json({
    message: 'Not Authorized'
  })
})
