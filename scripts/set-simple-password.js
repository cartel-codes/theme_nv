#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const password = 'NovrAux@2024'; // Simple password for testing
const email = 'admin@novraux.com';

async function resetPassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 Resetting admin password...\n');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the admin user
    const admin = await prisma.adminUser.update({
      where: { email },
      data: { password: hashedPassword },
    });
    
    console.log('✅ Password reset successfully!\n');
    console.log('📧 Email: ' + admin.email);
    console.log('🔑 Password: ' + password);
    console.log('\n⚠️  Keep these credentials safe!');
    
    // Verify the password works
    const verify = await bcrypt.compare(password, admin.password);
    console.log('\n✅ Password verification: ' + (verify ? 'PASSED' : 'FAILED'));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
