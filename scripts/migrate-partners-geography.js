// WHAT: Add countryId and cityId references to existing partners
// WHY: Enable proper relational queries (Partners → Cities → Countries)
// HOW: Match partners to countries/cities and add ObjectId references

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔗 Migrating partners to use geographic references...\n');
    
    // Load countries and cities
    const countries = await db.collection('countries').find({}).toArray();
    const cities = await db.collection('cities').find({}).toArray();
    
    const countryMap = new Map();
    const cityMap = new Map();
    
    // Build country lookup map
    countries.forEach(c => {
      countryMap.set(c.code.toUpperCase(), c);
      countryMap.set(c.name.toLowerCase(), c);
      c.aliases.forEach(alias => {
        countryMap.set(alias.toLowerCase(), c);
      });
    });
    
    // Build city lookup map (by name + countryId)
    cities.forEach(city => {
      const key = `${city.name.toLowerCase()}_${city.countryId.toString()}`;
      cityMap.set(key, city);
    });
    
    console.log(`Loaded ${countries.length} countries and ${cities.length} cities\n`);
    
    // Get all partners
    const partners = await db.collection('partners').find({}).toArray();
    console.log(`Found ${partners.length} partners to migrate\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const partner of partners) {
      // Extract country from sportsDb
      const countryName = partner.sportsDb?.strCountry || partner.sportsDb?.country || '';
      
      if (!countryName) {
        console.log(`⚠️  No country for ${partner.name} - skipping`);
        skipped++;
        continue;
      }
      
      // Match country
      const country = countryMap.get(countryName.toLowerCase());
      
      if (!country) {
        console.log(`⚠️  Unknown country for ${partner.name}: "${countryName}" - skipping`);
        skipped++;
        continue;
      }
      
      // Extract city from location hashtags
      const locationHashtags = partner.categorizedHashtags?.location || [];
      let city = null;
      
      for (const loc of locationHashtags) {
        const normalized = loc.toLowerCase();
        // Skip country names
        if (normalized === countryName.toLowerCase() || countryMap.has(normalized)) {
          continue;
        }
        // Try to find matching city
        const cityKey = `${normalized}_${country._id.toString()}`;
        city = cityMap.get(cityKey);
        if (city) break;
      }
      
      // Update partner with references
      const updateFields = {
        countryId: country._id,
        updatedAt: new Date().toISOString()
      };
      
      if (city) {
        updateFields.cityId = city._id;
      }
      
      await db.collection('partners').updateOne(
        { _id: partner._id },
        { $set: updateFields }
      );
      
      console.log(`  ✅ ${partner.name}: ${country.name}${city ? ` → ${city.name}` : ''}`);
      updated++;
    }
    
    console.log(`\n📊 Migration summary:`);
    console.log(`   ✅ Updated: ${updated} partners`);
    console.log(`   ⚠️  Skipped: ${skipped} partners`);
    
    // Create indexes on new fields
    await db.collection('partners').createIndex({ countryId: 1 });
    await db.collection('partners').createIndex({ cityId: 1 });
    
    console.log(`\n✅ Created indexes: countryId, cityId`);
    
    console.log('\n🎉 Partner migration completed successfully!');
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
