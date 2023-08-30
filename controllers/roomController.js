import { productModel } from "../model/productModel.js"
import { roomModel } from "../model/roomModel.js"
import { userModel } from "../model/userModel.js"

const createRoom = async (idPro, idUser) => {
    try {
        const room = new roomModel({
            users: idUser,
            product: idPro
        })
        await room.save()
        return room
    } catch (error) {
        return error
    }

}

const getRoomByIdProd = async (req, res) => {
    try {
        const id = req.params.id

        const room = await roomModel.findOne({ product: id })
        if (!room) {
            return res.status(400).json({ status: 'failure' });
        }
        return res.status(200).json({ status: 'success', room });

    } catch (error) {
        return res.status(500).json({ status: 'failure', error })
    }
}

const joinRoom = async (req, res) => {
    try {
        const { idProd, idUser, idRoom } = req.body
        const idp = await productModel.findById(idProd).select('_id')
        if (!idp) {
            return res.status(400).json({ status: 'failure', msg: 'Không tìm thấy sản phẩm' });
        }
        const idu = await userModel.findById(idUser).select('_id')
        if (!idu) {
            return res.status(400).json({ status: 'failure', msg: 'Không tìm thấy người dùng' });
        }

        const checkAlready = await roomModel.findOne({ _id: idRoom, users: idUser })
        if (checkAlready) {
            return res.status(400).json({ status: 'failure', msg: 'Người dùng đã tham gia rồi!' });
        }

        const idr = await roomModel.findByIdAndUpdate(
            idRoom,
            {
                $push: { users: idu }
            },
            { new: true }
        )

        await userModel.findByIdAndUpdate(
            idUser,
            {
                $push: { room: idr._id }
            },
            {
                new: true
            }
        )

        if (!idr) {
            return res.status(400).json({ status: 'failure', msg: 'Không thể tham gia' });
        }
        return res.status(200).json({ status: 'success', msg: 'Tham gia thành công' });


    } catch (error) {
        return res.status(500).json({ status: 'failure', error })
    }
}


export { getRoomByIdProd, createRoom, joinRoom }