import { categoryModel } from "../model/categoryModel.js";

const getCategoryById = async (req, res) => {
    const id = req.params.id

    const category = await categoryModel.findById(id).select('name')

    if (!category) {
        return res.status(400).json({ status: 'failure' })
    }
    return res.status(200).json({ status: 'success', category })

};

const getAllCategory = async (req, res) => {

    const category = await categoryModel.find().select('name _id')

    if (!category) {
        return res.status(400).json({ status: 'failure' })
    }
    return res.status(200).json({ status: 'success', category })

};

const create = async (req, res) => {
    try {
        const { name, link } = req.body

        const newCate = new categoryModel({
            name, link
        })
        await newCate.save()
        return res.status(200).json({ status: 'success', newCate })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const delCate = async (req, res) => {
    try {
        const id = req.params.id
        const newCate = await categoryModel.findByIdAndDelete(id)
        if (newCate) {
            return res.status(200).json({ status: 'success', newCate })
        }
    } catch (error) {
        return res.status(500).json({ status: 'failure' })

    }
}


export { create, delCate,getCategoryById,getAllCategory }