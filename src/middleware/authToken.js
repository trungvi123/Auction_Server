import jwt from "jsonwebtoken";

export const checkAccessToken = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization.split(" ")[1];
    if (!accessToken)
      return res.status(403).json({ status: "failure", msg: "Token not found" });

    jwt.verify(accessToken, process.env.SECRET_KEY, (err, data) => {
      if (err)
        return res.status(200).json({ status: "failure", msg: "Invalid token" });
      next();
    });
  } catch (error) {
    return res.status(500).json({ status: "failure" });
  }
};
