const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const Cryptr = require('cryptr');
const appError = require('../utils/appError');
const { catchAsync } = require('../controller/errorController');
// const mongoosastic = require('mongoosastic');
const BookModel = require('./bookModel');
const CategoryModel = require('./categoryModel');

// const ElasticSearch = require('../utils/elasticSearch');


const options = {
  separator: "-",
  truncate: 120,
}
const solutionSchema = mongoose.Schema({
  book:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'book'
  },
  category: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'category'
    }
  ],
  price: { type: Number, required: [true] },
  title: { type: String, required: true},//, es_indexed: true },
  question: { type: String, required: true},//, es_indexed: true },  // This description is the question
  answer: { type: String, select: false },
  status: { type: Boolean, required: [true, 'Status can either be true or false'] },
  file: { type: String, required: false },
  metaKeywords: { type: String, required: true },
  metaDescription: { type: String, required: true },
  transcribedImageText: { type: String},// es_indexed: true },
  slug: { type: String, slug: "title", slug_padding_size: 2, unique: true },
  noOfOrders: { type: Number, required: true, default: 0 },
  noOfDownloads: { type: Number, default: 0 },
  views: { type: Number, required: true, default: 0 },
  entryInformation: {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  }
}, {
  toJson: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
});


// Cryptr for encryption and decryption of data
const cryptr = new Cryptr(process.env.ANSWER_ENCRYPTION_SECREt_KEY);

// Logic related to answer sending field

solutionSchema.pre(/^find/, function (next) {

  // Update the log of the question before saving that what have changed
  // Never select the answer unless the correct token is passed
  // console.log(this._conditixons);
  if (this._conditions.hasOwnProperty('token') && this._conditions['token'] === process.env.ANS_VIEW_TOKEN) {
    delete this._conditions['token'];
  }
  else {
    if (this._userProvidedFields) {
      delete this._userProvidedFields['answer'];
      delete this._fields['answer'];
    }
  }

  next();

})



solutionSchema.pre(/^find/, function (next) {
  // console.log(this);
  this.populate({
    path: 'book',
    select:'title authorName'
  }).populate({
    path: 'category',
    select: 'name'
  })
  next();
})

solutionSchema.pre('save', function (next) {
  // encrypt the answer using cryptr
  if (this.isNew) {
    this.answer = cryptr.encrypt(this.answer);
  //  this.answer = encryptedString;

    // ElasticSearch.createIndex('solution', {
    //   _id: this._id,
    //   body: {
    //     title: this.title,
    //     question: this.question,
    //     transcribedImageText: this.transcribedImageText
    //   }
    // })
  }

  next();
});

solutionSchema.methods.getSingleSolution = async function (slug) {
  // decrypt the available answer
  if (this.answer) {
    const ans = cryptr.decrypt(this.answer);
    return {
      ...this._doc,
      answer: ans
    }
  }
  else return "No answer found";
}


solutionSchema.methods.getDecryptedAnswer = catchAsync(async function () {

})



// Mongoose Plugins
solutionSchema.plugin(slug);
// solutionSchema.plugin(mongoosastic, {
//   hosts: [
//     process.env.ELASTIC_HOST,
//   ],
//   bulk: {
//     size: 10, // preferred number of docs to bulk index
//     delay: 100 //milliseconds to wait for enough docs to meet size constraint
//   }
// });

module.exports = mongoose.model('solution', solutionSchema);
