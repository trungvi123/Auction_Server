const signUp = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { email, address, idCard, bankName, bankNumber, password, lastName, phoneNumber, key } = req.body
        if (process.env.ADMIN_KEY === key) {

            const already = await userModel.findOne({ email })
            if (already) {
                return res.status(400).json({ status: 'failure', errors: { msg: 'Tài khoản đã tồn tại!' } });
            }

            const salt = bcrypt.genSaltSync(12)
            const hashPassWord = bcrypt.hashSync(password, salt)

            const newUser = new userModel({
                firstName: req.body.firstName ? req.body.firstName : '',
                lastName,
                email,
                phoneNumber,
                hashPassWord,
                birthday: req.body.birthday ? req.body.birthday : '',
                idCard,
                role: 'admin',
                bankNumber,
                bankName,
                address
            })

            await newUser.save()
            return res.status(200).json({ status: 'success' });
        }
        return res.status(400).json({ status: 'failure' });

    } catch (error) {
        return res.status(500).json({ status: 'failure' });
    }
};

export { signUp }