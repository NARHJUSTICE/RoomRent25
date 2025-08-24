const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  houseNumber: {
    type: String,
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    region: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  rentPrice: {
    type: Number,
    required: true
  },
  photos: [{
    type: String
  }],
  videos: [{
    type: String
  }],
  amenities: [{
    type: String
  }],
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'room', 'studio'],
    required: true
  },
  bedrooms: {
    type: Number,
    required: true
  },
  bathrooms: {
    type: Number,
    required: true
  },
  availability: {
    type: String,
    enum: ['available', 'rented', 'maintenance'],
    default: 'available'
  },
  interestedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
propertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Property', propertySchema);