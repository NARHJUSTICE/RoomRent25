import React from 'react';
import { MapPin, Bed, Bath, DollarSign, Calendar, Heart } from 'lucide-react';

const PropertyCard = ({ property, onViewDetails, onShowInterest, showOwnerInfo = false }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {property.photos && property.photos.length > 0 ? (
          <img
            src={property.photos[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image Available
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            property.availability === 'available' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {property.availability}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{property.title}</h3>
          <div className="flex items-center text-green-600 font-bold">
            <DollarSign className="w-4 h-4" />
            <span>{formatPrice(property.rentPrice)}/month</span>
          </div>
        </div>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm truncate">
            {property.address.street}, {property.address.city}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-gray-600 mb-3">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            <span className="text-sm">{property.bedrooms} beds</span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span className="text-sm">{property.bathrooms} baths</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm capitalize">{property.propertyType}</span>
          </div>
        </div>

        {showOwnerInfo && property.owner && (
          <div className="border-t pt-3 mb-3">
            <p className="text-sm text-gray-600">
              Owner: <span className="font-medium">{property.owner.name}</span>
            </p>
            <p className="text-sm text-gray-600">
              Contact: <span className="font-medium">{property.owner.phone}</span>
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(property)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Details
          </button>
          {!showOwnerInfo && onShowInterest && (
            <button
              onClick={() => onShowInterest(property)}
              className="flex items-center justify-center bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;