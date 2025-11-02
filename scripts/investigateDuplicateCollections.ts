/**
 * Investigate Duplicate Collections
 * Compares data between duplicate junction tables and collection naming inconsistencies
 */

import { MongoClient } from 'mongodb';
import config from '../lib/config';

async function investigate() {
  const client = new MongoClient(config.mongodbUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(config.dbName);

    // 1. Compare bitly junction tables
    console.log('🔍 INVESTIGATING BITLY JUNCTION TABLES:');
    console.log('='.repeat(80));
    
    const bitlyProjectLinks = db.collection('bitly_project_links');
    const bitlyLinkProjectJunction = db.collection('bitly_link_project_junction');
    
    const bpl = await bitlyProjectLinks.find({}).limit(5).toArray();
    const blpj = await bitlyLinkProjectJunction.find({}).limit(5).toArray();
    
    console.log('\n📊 bitly_project_links (252 docs) - Sample:');
    console.log(JSON.stringify(bpl[0], null, 2));
    
    console.log('\n📊 bitly_link_project_junction (22 docs) - Sample:');
    console.log(JSON.stringify(blpj[0], null, 2));
    
    // Check for overlap
    const bplIds = new Set(bpl.map(doc => `${doc.projectId}-${doc.bitlyLinkId}`));
    const blpjIds = new Set(blpj.map(doc => `${doc.projectId}-${doc.bitlyLinkId}`));
    
    const overlap = [...bplIds].filter(id => blpjIds.has(id));
    console.log(`\n⚠️  Overlap between collections: ${overlap.length} common pairs`);

    // 2. Check chartConfigurations vs chart_configurations
    console.log('\n\n🔍 INVESTIGATING CHART COLLECTIONS:');
    console.log('='.repeat(80));
    
    const chartConfigsCamel = db.collection('chartConfigurations');
    const chartConfigsSnake = db.collection('chart_configurations');
    
    const camelCount = await chartConfigsCamel.countDocuments();
    const snakeCount = await chartConfigsSnake.countDocuments().catch(() => 0);
    
    console.log(`\n📊 chartConfigurations (camelCase): ${camelCount} docs`);
    console.log(`📊 chart_configurations (snake_case): ${snakeCount} docs`);
    
    if (camelCount > 0) {
      const sample = await chartConfigsCamel.findOne({});
      console.log('\nSample from chartConfigurations:');
      console.log(JSON.stringify(sample, null, 2));
    }

    // 3. Check variablesGroups vs variables_groups
    console.log('\n\n🔍 INVESTIGATING VARIABLES GROUPS:');
    console.log('='.repeat(80));
    
    const varGroupsCamel = db.collection('variablesGroups');
    const varGroupsSnake = db.collection('variables_groups');
    
    const camelVarCount = await varGroupsCamel.countDocuments();
    const snakeVarCount = await varGroupsSnake.countDocuments().catch(() => 0);
    
    console.log(`\n📊 variablesGroups (camelCase): ${camelVarCount} docs`);
    console.log(`📊 variables_groups (snake_case): ${snakeVarCount} docs`);

    // 4. Check variablesConfig vs variables_metadata
    console.log('\n\n🔍 INVESTIGATING VARIABLES CONFIG:');
    console.log('='.repeat(80));
    
    const varConfigCamel = db.collection('variablesConfig');
    const varMetadata = db.collection('variables_metadata');
    
    const configCount = await varConfigCamel.countDocuments();
    const metadataCount = await varMetadata.countDocuments();
    
    console.log(`\n📊 variablesConfig (camelCase): ${configCount} docs`);
    console.log(`📊 variables_metadata (snake_case): ${metadataCount} docs`);
    
    if (configCount > 0) {
      const sample = await varConfigCamel.findOne({});
      console.log('\nSample from variablesConfig:');
      console.log(JSON.stringify(sample, null, 2));
    }

    // 5. Check users vs local_users
    console.log('\n\n🔍 INVESTIGATING USERS COLLECTIONS:');
    console.log('='.repeat(80));
    
    const users = db.collection('users');
    const localUsers = db.collection('local_users');
    
    const usersCount = await users.countDocuments();
    const localUsersCount = await localUsers.countDocuments().catch(() => 0);
    
    console.log(`\n📊 users: ${usersCount} docs`);
    console.log(`📊 local_users: ${localUsersCount} docs`);
    
    if (usersCount > 0) {
      const sample = await users.findOne({});
      console.log('\nSample from users:');
      console.log(JSON.stringify(sample, null, 2));
    }

    // 6. Check viewSlug/editSlug in projects
    console.log('\n\n🔍 INVESTIGATING PROJECT SLUG FIELDS:');
    console.log('='.repeat(80));
    
    const projects = db.collection('projects');
    const projectsWithSlugs = await projects.find({
      $or: [
        { viewSlug: { $exists: true } },
        { editSlug: { $exists: true } }
      ]
    }).toArray();
    
    console.log(`\n📊 Projects with viewSlug/editSlug: ${projectsWithSlugs.length}`);
    if (projectsWithSlugs.length > 0) {
      const sample = projectsWithSlugs[0];
      console.log('\nSample project with slug fields:');
      console.log(JSON.stringify({
        _id: sample._id,
        eventName: sample.eventName,
        slug: sample.slug,
        viewSlug: sample.viewSlug,
        editSlug: sample.editSlug
      }, null, 2));
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Investigation complete');
    console.log('='.repeat(80) + '\n');
    
  } finally {
    await client.close();
  }
}

investigate().catch(console.error);
