// WHAT: Extract cities from partners and create cities collection with country references
// WHY: Enable proper geographic relationships (Partners → Cities → Countries)
// HOW: Query existing partners, match cities to countries, create with references

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🏙️  Extracting cities from partners...\n');
    
    // Get all partners with location data
    const partners = await db.collection('partners').find({
      $or: [
        { 'categorizedHashtags.location': { $exists: true, $ne: [] } },
        { 'sportsDb.strCountry': { $exists: true, $ne: '' } }
      ]
    }).toArray();
    
    console.log(`Found ${partners.length} partners with venue/location data\n`);
    
    // Get all countries for matching
    const countries = await db.collection('countries').find({}).toArray();
    const countryMap = new Map();
    
    // Build lookup maps
    countries.forEach(c => {
      countryMap.set(c.code.toUpperCase(), c);
      countryMap.set(c.name.toLowerCase(), c);
      c.aliases.forEach(alias => {
        countryMap.set(alias.toLowerCase(), c);
      });
    });
    
    console.log(`Loaded ${countries.length} countries for matching\n`);
    
    // Extract unique cities
    const cityMap = new Map();
    
    for (const partner of partners) {
      // Extract country from sportsDb
      const countryName = partner.sportsDb?.strCountry || partner.sportsDb?.country || '';
      
      if (!countryName) continue;
      
      // Match country
      const country = countryMap.get(countryName.toLowerCase());
      
      if (!country) {
        console.log(`⚠️  Unknown country for ${partner.name}: "${countryName}"`);
        continue;
      }
      
      // Extract city from categorizedHashtags.location
      const locationHashtags = partner.categorizedHashtags?.location || [];
      
      // Find city (first location tag that's not the country)
      let cityName = null;
      
      for (const loc of locationHashtags) {
        const normalized = loc.toLowerCase();
        // Skip if it matches the country name or code
        if (normalized === countryName.toLowerCase() || 
            countryMap.has(normalized)) {
          continue;
        }
        // Use first non-country location as city
        cityName = loc.charAt(0).toUpperCase() + loc.slice(1); // Capitalize
        break;
      }
      
      if (!cityName || cityName.length < 3) continue; // Skip if no city found or too short
      
      // Create unique key
      const key = `${cityName.toLowerCase()}_${country._id.toString()}`;
      
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          name: cityName,
          countryId: country._id,
          countryName: country.name,
          partners: []
        });
      }
      
      cityMap.get(key).partners.push(partner.name);
    }
    
    console.log(`Extracted ${cityMap.size} unique cities\n`);
    
    // Clear existing cities collection
    await db.collection('cities').deleteMany({});
    console.log('✅ Cleared existing cities\n');
    
    // Prepare city documents
    const now = new Date().toISOString();
    const cityDocs = Array.from(cityMap.values()).map(city => ({
      name: city.name,
      countryId: city.countryId,
      coordinates: {
        latitude: null,  // To be populated later
        longitude: null
      },
      timezone: null,    // To be populated later
      active: true,
      createdAt: now,
      updatedAt: now
    }));
    
    if (cityDocs.length === 0) {
      console.log('⚠️  No cities extracted. Check partner data format.\n');
      return;
    }
    
    // Insert cities
    const result = await db.collection('cities').insertMany(cityDocs);
    console.log(`✅ Inserted ${result.insertedCount} cities\n`);
    
    // Create indexes
    await db.collection('cities').createIndex({ countryId: 1 });
    await db.collection('cities').createIndex({ name: 1, countryId: 1 }, { unique: true });
    await db.collection('cities').createIndex({ name: 'text' });
    
    console.log('✅ Created indexes: countryId, name+countryId (unique), name (text)\n');
    
    // Summary by country
    const citiesByCountry = await db.collection('cities').aggregate([
      {
        $lookup: {
          from: 'countries',
          localField: 'countryId',
          foreignField: '_id',
          as: 'country'
        }
      },
      { $unwind: '$country' },
      {
        $group: {
          _id: '$country.name',
          count: { $sum: 1 },
          cities: { $push: '$name' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    console.log('📊 Top countries by city count:');
    citiesByCountry.forEach(c => {
      console.log(`   ${c._id}: ${c.count} cities (${c.cities.slice(0, 3).join(', ')}${c.count > 3 ? '...' : ''})`);
    });
    
    console.log('\n🎉 Cities collection seeded successfully!');
    console.log(`📚 Collection: cities`);
    console.log(`🔢 Total: ${result.insertedCount} cities`);
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
