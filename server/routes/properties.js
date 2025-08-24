const express = require('express');
const { body, validationResult } = require('express-validator');
const Property = require('../models/Property');
const User = require('../models/User');
const { authenticateToken, requireSubscription, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all properties (for browsing)
router.get('/', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { lat, lng, radius = 10, propertyType, minPrice, maxPrice, bedrooms } = req.query;
    
    let query = { availability: 'available' };
    
    // Filter by property type
    if (propertyType) {
      query.propertyType = propertyType;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.rentPrice = {};
      if (minPrice) query.rentPrice.$gte = Number(minPrice);
      if (maxPrice) query.rentPrice.$lte = Number(maxPrice);
    }
    
    // Filter by bedrooms
    if (bedrooms) {
      query.bedrooms = Number(bedrooms);
    }

    let properties;
    
    // Location-based search
    if (lat && lng) {
      properties = await Property.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [Number(lng), Number(lat)]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        }
      }).populate('owner', 'name email phone profileImage').limit(50);
    } else {
      properties = await Property.find(query)
        .populate('owner', 'name email phone profileImage')
        .limit(50);
    }

    res.json(properties);
  } catch (error) {
    console.error('Properties fetch error:', error);
    res.status(500).json({ message: 'Error fetching properties' });
  }
});

// Get single property details
router.get('/:id', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone profileImage');
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json({ message: 'Error fetching property' });
  }
});

// Create new property (landlords only)
router.post('/', [
  authenticateToken,
  requireSubscription,
  requireRole(['landlord']),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('houseNumber').notEmpty().withMessage('House number is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.region').notEmpty().withMessage('Region is required'),
  body('rentPrice').isNumeric().withMessage('Rent price must be a number'),
  body('propertyType').isIn(['apartment', 'house', 'room', 'studio']).withMessage('Valid property type is required'),
  body('bedrooms').isNumeric().withMessage('Number of bedrooms must be a number'),
  body('bathrooms').isNumeric().withMessage('Number of bathrooms must be a number'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Location coordinates are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const propertyData = {
      ...req.body,
      owner: req.user._id
    };

    const property = new Property(propertyData);
    await property.save();

    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email phone profileImage');

    res.status(201).json({
      message: 'Property created successfully',
      property: populatedProperty
    });
  } catch (error) {
    console.error('Property creation error:', error);
    res.status(500).json({ message: 'Error creating property' });
  }
});

// Update property (landlords only, own properties)
router.put('/:id', [
  authenticateToken,
  requireSubscription,
  requireRole(['landlord'])
], async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    Object.assign(property, req.body);
    await property.save();

    const updatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email phone profileImage');

    res.json({
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Property update error:', error);
    res.status(500).json({ message: 'Error updating property' });
  }
});

// Delete property (landlords only, own properties)
router.delete('/:id', [
  authenticateToken,
  requireSubscription,
  requireRole(['landlord'])
], async (req, res) => {
  try {
    const property = await Property.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Property deletion error:', error);
    res.status(500).json({ message: 'Error deleting property' });
  }
});

// Get landlord's properties
router.get('/my/properties', [
  authenticateToken,
  requireSubscription,
  requireRole(['landlord'])
], async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id })
      .populate('interestedUsers.user', 'name email phone idProofDocument')
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    console.error('My properties fetch error:', error);
    res.status(500).json({ message: 'Error fetching your properties' });
  }
});

// Express interest in property (users only)
router.post('/:id/interest', [
  authenticateToken,
  requireSubscription,
  requireRole(['student', 'government_worker', 'family'])
], async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user already expressed interest
    const alreadyInterested = property.interestedUsers.find(
      interested => interested.user.toString() === req.user._id.toString()
    );

    if (alreadyInterested) {
      return res.status(400).json({ message: 'You have already expressed interest in this property' });
    }

    // Check if user has uploaded ID proof
    if (!req.user.idProofDocument) {
      return res.status(400).json({ message: 'Please upload your ID proof document before expressing interest' });
    }

    property.interestedUsers.push({
      user: req.user._id,
      appliedAt: new Date()
    });

    await property.save();

    res.json({ message: 'Interest expressed successfully' });
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({ message: 'Error expressing interest' });
  }
});

module.exports = router;