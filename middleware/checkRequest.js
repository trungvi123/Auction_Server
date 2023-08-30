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

export const checkProduct = [
    body('name', 'Invalid name').trim().not().isEmpty(),
    body('basePrice', 'Invalid basePrice').trim().not().isEmpty(),
    body('stepPrice', 'Invalid stepPrice').trim().not().isEmpty(),
    body('startTime', 'Invalid startTime').trim().not().isEmpty(),
    body('duration', 'Invalid duration').trim().not().isEmpty(),
    body('owner', 'Invalid owner').trim().not().isEmpty(),
    body('price', 'Invalid price').trim().not().isEmpty(),
    body('owner', 'Invalid owner').trim().not().isEmpty(),
    body('endTime', 'Invalid endTime').trim().not().isEmpty(),
    body('category', 'Invalid category').trim().not().isEmpty(),
]
