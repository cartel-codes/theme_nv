#!/usr/bin/env node
const crypto = require('crypto');

// Generate random password
const password = crypto.randomBytes(16).toString('hex');
const email = 'admin@novraux.com';

console.log('🔐 Resetting admin password...\n');

// Import Prisma
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the admin user
    const admin = await prisma.adminUser.update({
      where: { email },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });
    
    console.log('✅ Admin password reset successfully!\n');
    console.log('Updated Admin Details:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Active: ${admin.isActive}`);
    console.log(`  Updated: ${admin.updatedAt}\n`);
    
    console.log('🔑 New Credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}\n`);
    
    console.log('⚠️  Save these credentials securely!');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
