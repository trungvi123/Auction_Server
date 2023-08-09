import { body } from "express-validator"





export const checkSignUp = [
    body('lastName', 'Invalid name').trim().not().isEmpty(),
    body('email', 'Invalid email').trim().isEmail(),
    body('password', 'Enter valid password with min length of 3 char')
        .trim()
        .isLength({ min: 3 }),
]

export const checkSignIn = [
    body('email', 'Invalid email').trim().isEmail(),
    body('password', 'Enter valid password with min length of 3 char')
        .trim()
        .isLength({ min: 3 }),
]

export const checkEmail = [
    body('email', 'Invalid email').trim().isEmail()
]