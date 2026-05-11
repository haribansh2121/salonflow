const { TenantSetting } = require('../models');

const checkPermission = (moduleName) => {
  return async (req, res, next) => {
    // Admins have full access always
    if (req.user.role && req.user.role.toUpperCase() === 'ADMIN') {
      return next();
    }

    let permissions = req.user.permissions || [];

    // FALLBACK: If permissions array is empty, read from TenantSetting.rolePermissions
    // This covers STAFF users who have no custom Role assigned (roleId = null)
    if (permissions.length === 0 && req.user.tenantId) {
      try {
        const settings = await TenantSetting.findOne({ where: { tenantId: req.user.tenantId } });
        if (settings && settings.rolePermissions) {
          const roleKey = req.user.role?.toUpperCase() || 'STAFF';
          permissions = settings.rolePermissions[roleKey] || settings.rolePermissions['STAFF'] || [];
        }
      } catch (e) {
        console.error('[Permission] Failed to load fallback permissions:', e.message);
      }
    }

    // Direct match
    if (permissions.includes(moduleName)) {
      return next();
    }

    // SPECIAL CASE: If user has 'billing' permission, allow READ access to
    // related modules needed for creating a bill (services, products, staff, customers, branches)
    const catalogModules = ['services', 'products', 'staff', 'customers', 'branches'];
    if (req.method === 'GET' && permissions.includes('billing') && catalogModules.includes(moduleName)) {
      return next();
    }

    console.warn(`[Permission Denied] User: ${req.user.email}, Role: ${req.user.role}, Module: ${moduleName}, Permissions: [${permissions.join(', ')}]`);
    return res.status(403).json({ 
      error: `Access Denied: You do not have permission for ${moduleName}`,
      module: moduleName
    });
  };
};

module.exports = checkPermission;
