export const isAdmin = (req, res, next) => {
  if (req.user.user_type !== "admin") {
    return res.status(403).json({ success: false, message: "admin only" });
  }
  next();
};
