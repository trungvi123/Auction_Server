import jwt from "jsonwebtoken";

export const checkAccessToken = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization.split(" ")[1];
    if (!accessToken)
      return res.status(403).json({ status: "failure", msg: "Token not found" });

    jwt.verify(accessToken, process.env.SECRET_KEY, (err, data) => {
      if (err) {
        return res.status(401).json({ status: "failure", msg: "Invalid token" });
      }
      req.dataFromToken = data
      next();
    });
  } catch (error) {
    return res.status(500).json({ status: "failure" });
  }
};

export const checkAccessTokenAndVerifyAccount = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization.split(" ")[1];
    if (!accessToken)
      return res.status(403).json({ status: "failure", msg: "Token not found" });

    jwt.verify(accessToken, process.env.SECRET_KEY, (err, data) => {
      if (err) {
        return res.status(401).json({ status: "failure", msg: "Invalid token" });
      }
      if (data.verifyAccount) {
        req.dataFromToken = data
        next();
      }else {
        return res.status(400).json({ status: "failure", msg: "Vui lòng xác minh tài khoản!" });
      }
    });
  } catch (error) {
    return res.status(500).json({ status: "failure" });
  }
};

export const checkAdminAccessToken = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization.split(" ")[1];
    if (!accessToken)
      return res.status(403).json({ status: "failure", msg: "Token not found" });

    jwt.verify(accessToken, process.env.SECRET_KEY, (err, data) => {
      if (err) {
        return res.status(401).json({ status: "failure", msg: "Invalid token" });
      }
      if (data.role === 'admin') {
        next();
      } else {
        return res.status(401).json({ status: "failure", msg: "Not authorized" });
      }
    });
  } catch (error) {
    return res.status(500).json({ status: "failure" });
  }
};


export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, secretKey, { expiresIn: accessTokenExpiration });
  const refreshToken = jwt.sign(payload, refreshTokenSecret, { expiresIn: refreshTokenExpiration });
  return { accessToken, refreshToken };
}
