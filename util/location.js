const axios = require('axios');
const HttpError = require('../models/http-error');

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  );

  const data = response.data;

  if (!data || data.length === 0) {
    const error = new HttpError(
      'Could not find location for the specified address.',
      422
    );
    throw error;
    
  }

  const coordinates = {
    lat: data[0].lat,
    lng: data[0].lon,
    // lat: 13.6795235,
    // lng: 79.3497522,

  };
console.log(coordinates,"coordinates");

  return coordinates;
}

module.exports = getCoordsForAddress;
