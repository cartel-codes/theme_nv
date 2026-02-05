#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

async function checkAdmin() {
  const prisma = new PrismaClient();
  
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email: 'admin@novraux.com' },
    });
    
    if (!admin) {
      console.log('❌ Admin user NOT found in database');
      process.exit(1);
    }
    
    console.log('✅ Admin user found:\n');
    console.log(`  ID: ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Active: ${admin.isActive}`);
    console.log(`  Created: ${admin.createdAt}`);
    console.log(`  Updated: ${admin.updatedAt}`);
    console.log(`  Password Hash: ${admin.password.substring(0, 20)}...`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
