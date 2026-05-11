require('dotenv').config();
const { User, Role } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function testNishaLogin() {
  try {
    // 1. Check Nisha's user record
    const user = await User.findOne({ 
      where: { email: 'nisha@gmail.com' },
      include: [{ model: require('./models/Tenant') }, { model: Role }]
    });
    
    if (!user) {
      console.log('❌ User nisha@gmail.com NOT FOUND');
      process.exit(1);
    }
    
    console.log('=== NISHA USER RECORD ===');
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('RoleId:', user.roleId);
    console.log('BranchId:', user.branchId);
    console.log('Role Object:', user.Role ? `${user.Role.name} → ${JSON.stringify(user.Role.permissions)}` : 'NULL');

    // 2. Test password
    const isMatch = await bcrypt.compare('12345', user.passwordHash);
    console.log('\n=== PASSWORD CHECK ===');
    console.log('Password "12345" matches:', isMatch ? '✅ YES' : '❌ NO');

    // 3. Simulate the login fallback logic
    let permissions = user.Role?.permissions || [];
    if (!user.Role && user.role && user.role !== 'ADMIN' && user.role !== 'STAFF') {
      console.log('\n⚡ Fallback: Looking up Role by name "' + user.role + '"...');
      const foundRole = await Role.findOne({ 
        where: { name: user.role, tenantId: user.tenantId } 
      });
      if (foundRole) {
        permissions = foundRole.permissions || [];
        await user.update({ roleId: foundRole.id });
        console.log('✅ Found! Linked roleId:', foundRole.id);
      } else {
        console.log('❌ No Role found with name "' + user.role + '"');
      }
    }

    console.log('\n=== RESOLVED PERMISSIONS ===');
    console.log('Permissions:', JSON.stringify(permissions));

    // 4. Check which modules Nisha CAN access
    const allModules = ['appointments', 'billing', 'services', 'products', 'customers', 'reports', 'marketing', 'staff'];
    console.log('\n=== MODULE ACCESS ===');
    allModules.forEach(mod => {
      const hasAccess = permissions.includes(mod);
      console.log(`  ${hasAccess ? '✅' : '❌'} ${mod}`);
    });

    // 5. Generate token
    const token = jwt.sign(
      { 
        id: user.id, email: user.email, role: user.role, 
        tenantId: user.tenantId, branchId: user.branchId,
        name: user.name, permissions: permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('\n=== JWT TOKEN (first 50 chars) ===');
    console.log(token.substring(0, 50) + '...');

    // 6. Verify the token decodes correctly
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('\n=== DECODED TOKEN PERMISSIONS ===');
    console.log('Permissions in JWT:', JSON.stringify(decoded.permissions));

    // 7. Verify after fix
    const updatedUser = await User.findOne({ 
      where: { email: 'nisha@gmail.com' },
      include: [{ model: Role }]
    });
    console.log('\n=== AFTER AUTO-FIX ===');
    console.log('RoleId:', updatedUser.roleId);
    console.log('Role Object:', updatedUser.Role ? `${updatedUser.Role.name} → ${JSON.stringify(updatedUser.Role.permissions)}` : 'STILL NULL');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

testNishaLogin();
