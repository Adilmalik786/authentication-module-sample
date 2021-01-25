// Utillities
const appError = require('../utils/appError');
const emailHandler = require('../utils/email');
const { catchAsync } = require('../controller/errorController');







exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Generate error if the user tries to change the password
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('Cannot change password through this route. Please go to /update-password', 400))
  }
  // 2) Filter out the unwanted field names
  const filterBody = filterObj(req.body, 'name', 'email'); // filter the fields to have only these fields

  // 3) Update User document
  const updatedUser = await Users.findByIdAndUpdate(req.user.id, filterBody, { new: true, runValidators: true });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })

})
