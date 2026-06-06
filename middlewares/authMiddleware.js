import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // ✅ Token expired → mark the user offline immediately
      if (err.name === 'TokenExpiredError') {
        const payload = jwt.decode(token);
        if (payload?.id) {
          await User.findByIdAndUpdate(payload.id, {
            isActive: false,
            lastSeen: new Date()
          });
        }
      }
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    // ✅ Keep lastSeen fresh on every authenticated request
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

    next();

  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};