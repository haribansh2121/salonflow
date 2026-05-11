const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id, email, role, tenantId, branchId

    // Extract Branch ID from header
    const headerBranchId = req.headers['x-branch-id'];
    
    // If user is STAFF, they must stay in their assigned branch
    if (req.user.role === 'STAFF' && req.user.branchId) {
      req.branchId = req.user.branchId;
    } else {
      // ADMIN or unassigned staff can use the header branch
      req.branchId = headerBranchId || null;
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
