#!/usr/bin/env node
const crypto = require('crypto');
const path = require('path');

// Generate random credentials
const username = `admin_${crypto.randomBytes(4).toString('hex')}`;
const password = crypto.randomBytes(16).toString('hex');
const email = 'admin@novraux.com';

console.log('🔐 Creating new admin user...\n');
console.log('Admin Credentials:');
console.log(`  Email: ${email}`);
console.log(`  Username: ${username}`);
console.log(`  Password: ${password}`);
console.log('\n📝 Saving credentials...\n');

// Import Prisma
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the admin user
    const admin = await prisma.adminUser.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });
    
    console.log('✅ Admin user created successfully!\n');
    console.log('User Details:');
    console.log(`  ID: ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Active: ${admin.isActive}`);
    console.log(`  Created: ${admin.createdAt}\n`);
    
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    console.log(`  Email: ${email}`);
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}\n`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
