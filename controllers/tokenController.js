import jwt from "jsonwebtoken";

const refreshTokenMethod = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(200).json({status:'failure', message: 'Không tìm thấy refresh token' });
    }

    const decodedRefreshToken = jwt.verify(refreshToken, process.env.SECRET_REFRESH_KEY);

    if (!decodedRefreshToken) {
        return res.status(403).json({ status:'failure',message: 'Refresh token không hợp lệ' });
    }

    const userPayload = {
        _id: decodedRefreshToken._id,
        role: decodedRefreshToken.role,
        email: decodedRefreshToken.email,
        lastName: decodedRefreshToken.lastName
    };
    const accessToken = jwt.sign(userPayload, process.env.SECRET_KEY, { expiresIn: '1d' });

    return res.status(200).json({ status: 'success', accessToken });
}

export { refreshTokenMethod }