const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    requied: [true, 'First Name is required']
  },
  // middleName: { type: String },
  lastName: { type: String },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email']
  },


  password: {
    type: String,
    require: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    // This only works on Create and SAVE!!!
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Confirm password: "{VALUE}" should be the same as password'
    }
  },
  passwordChangedAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  oAuthProvider: { type: String },
  oAuthSub: {type: String},

  role: {
    type: String,
    enum: {
      values: ['user', 'student', 'tutor', 'admin', 'moderator', 'analyst', 'data-entry', 'quality-assurance'],
      message: 'The user role should be user, student, tutor, admin, moderator, analyst, data-entry, quality-assurance'
    },
    default: 'user'
  },

  dob: { type: Date },
  gender: {
    type: String,
    enum: ['male', 'female']
  },

  accountStatus: {
    type: String,
    default: 'active',
    enum: ['active', 'deactive', 'suspended', 'pending'],
    select: false
  },

  moblieNo: { type: Number },
  address: {
    city: { type: String },
    street: { type: String },
    state: { type: String },
    country: { type: String },
  },
  image: { type: String },
  credits: { type: Number },
  balance: { type: Number },


  suspend: {
    reason: {},

  },
  notifications: [{
    text: { type: String },
    link: { type: String },
    status: {
      type: String,
      enum: ["read", "unread"]
    },
    // notification from the person --  it could be the system
    notifier: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    createdAt: { type: Date },
  }],

  referredBy: {
    token: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
  },



  emailVerificateion: {
    verificationToken: { type: String },
    emailStatus: { type: Boolean },
    createdAt: { type: Date },
    modifiedAt: { type: Date }
  },




  student: {
    interest: { type: String },
    freeQuestion: { type: String },
    createdAt: { type: Date },
  },




  tutor: {
    bidsRemaining: { type: String },
    level: { type: Number, enum: [1, 2, 3, 4] },
    tier: { type: String, enum: ['silver', 'gold', 'platinum'] },
    description: { type: String },
    createdAt: { type: Date },


    bidQuestion: [    //Refernce to the bid Questions
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'question'
      }
    ],

    experience: [{
      title: { type: String },
      description: { type: String },
      startingDate: { type: Date },
      endingDate: { type: Date },
    }],

    education: [{
      country: { type: String },
      degreeName: { type: String },
      startingDate: { type: Date },
      endingDate: { type: Date },
      institute: { type: String },
      description: { type: String },
    }],

    project: [{
      name: { type: String },
      completionDate: { type: Date },
      company: { type: String },
      institute: { type: String },
    }],

    skills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'category'
    }]
  },

}, { timestamps: true });

// Date of birth Checking Middleware
userSchema.pre('save', function (next) {
  console.log('date of birth middleware');
  if (Date(this.dob) > Date.now()) {
    next(new AppError('Date of Birth should be less than today', 400))  // throw error for date of birth should not be greater than the date of today
  }

  if (this.firstName.length < 3) {
    next(new AppError('First name should contain atleast 3 letters', 400));
  }
  next();
})


// Bcrypting the password and saving it to db
userSchema.pre('save', async function (next) {
  // if password is not modified the return from this method

  console.log('bcrypting password');
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // delete the confirm password
  this.passwordConfirm = undefined;

  next();

})


// Password updated middleware to add passwordChangedAt property
userSchema.pre('save', function (next) {
  // if the password has not been modified then return from this function
  console.log('password checking middleware')
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  // subtract the password changed at to the past because saving to database is slower than issuing jwt
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Password updated middleware to add passwordChangedAt property
userSchema.pre('save', function (next) {

  // if the entry in newly inserted and student property is initialized then set the createdat value
  console.log('student checking middleware')
  if (this.isNew) {
    if (this.role === 'student')
      this.set(this.student.createdAt = Date.now())
    else if (this.role === 'tutor')
      this.set(this.tutor.createdAt = Date.now())
    return next();
  }
  next();
});

// Instance method
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

// Instance method to check if the password has been changed after issuing the jwt token
userSchema.methods.passwordChangeAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    // False means that password does not changed
    // if changed time stamp is greater than the time issued the token
    return JWTTimestamp < changedTimeStamp
  }

  // it means that password has never been changed
  return false;
}

userSchema.methods.createPasswordResetToken = function () {
  // Generate the random token of 32 characters
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Create the hash of the token that has been generate and encrypt it with sha 256
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set the password reset to the 10 minutes in the future
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log(`Reset Token: ${resetToken}, \nPassword Reset Token: ${this.passwordResetToken}`);
  // this will be sent through
  return resetToken;
}


userSchema.plugin(uniqueValidator, { message: '{PATH} should be unique' });


module.exports = mongoose.model('user', userSchema);
