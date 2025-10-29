const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const projectSlug = process.argv[2] || 'e64447c5-b031-43d9-9bc1-d094324dd2a9';

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('messmass');
  
  const project = await db.collection('projects').findOne({ slug: projectSlug });
  
  if (!project) {
    console.log('Project not found');
    await client.close();
    return;
  }
  
  console.log('Event:', project.eventName);
  console.log('Has bitlyCountry1:', project.stats?.bitlyCountry1 || 'NO');
  console.log('Has bitlyTopCountry:', project.stats?.bitlyTopCountry || 'NO');
  
  const junctions = await db.collection('bitly_link_project_junction').find({
    projectId: project._id
  }).toArray();
  
  console.log('Bitly links associated:', junctions.length);
  
  if (junctions.length > 0) {
    const linkIds = junctions.map(j => j.bitlyLinkId);
    const links = await db.collection('bitly_links').find({
      _id: { $in: linkIds }
    }).toArray();
    
    console.log('\nBitly links:');
    links.forEach(link => {
      console.log('  -', link.bitlink);
      console.log('    Has country data:', !!link.cachedMetrics?.topCountries);
      if (link.cachedMetrics?.topCountries) {
        console.log('    Countries:', link.cachedMetrics.topCountries.slice(0, 3).map(c => c.country).join(', '));
      }
    });
  }
  
  await client.close();
})();
