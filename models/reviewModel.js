const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
/*=======================================================
Sử dụng schema index như thế này để giải quyết vấn đề khi ta cần 2 trường dữ liệu đồng thời là unique (Một User chỉ được Review 1 lần cho mỗi Tour => (user && tour) là unique)
=======================================================*/
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
// Middleware of find
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});
/*=======================================================
Đoạn code này sử dụng khi có một trường dữ liệu trong bảng A cần cập nhật lại mỗi khi có sự thay đổi dữ liệu trong bảng B (Tour cần update lại avarage rating and rating quantity mỗi khi có sự thay đổi trong bảng Review (CREATE, UPDATE, DELETE) )
=======================================================*/
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const updateObj = {};
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  if (stats.length > 0) {
    updateObj.ratingsQuantity = stats[0].nRating;
    updateObj.ratingsAverage = stats[0].avgRating;
  } else {
    updateObj.ratingsQuantity = 0;
    updateObj.ratingsAverage = 4.5;
  }
  await Tour.findByIdAndUpdate(tourId, updateObj);
};

reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function(next) {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
//=======================================================

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

// POST /tour/:id/reviews
