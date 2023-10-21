import { getCurrentPriceById_server, updateCurrentPriceById_server, updateBidForProduct_server } from "../controllers/productController.js";
import { updateBidsForUserById_server } from "../controllers/userController.js";

const startWebsocket = (io) => {
    io.on('connection', (socket) => {
        socket.on('joinRoom', (data) => {
            socket.join(data)
        })

        socket.on('join_Notification_Room', (data) => {
            socket.join(data)
        })
    

        socket.on('bid_price', async (data) => {
            const idProduct = await getCurrentPriceById_server(data.product)
            const auctionTypeSlug = data.auctionTypeSlug
            let check = false
            if (auctionTypeSlug === 'dau-gia-xuoi' && data.price > parseFloat(idProduct.currentPrice)) {
                check = true
            }

            if (auctionTypeSlug === 'dau-gia-nguoc' && data.price < parseFloat(idProduct.currentPrice)) {
                check = true
            }

            if (check) {
                const upPrice = await updateCurrentPriceById_server(data.product, data.price)
                if (upPrice) {
                    const res = {
                        product: data.product,
                        price: upPrice.currentPrice,
                        users: data.users,
                    }
                    socket.broadcast.emit('respone_bid_price', res)
                }
                const infor = {
                    user: data.users,
                    price: data.price,
                    lastName: data.lastName
                }
                const upBids = await updateBidForProduct_server(data.product, infor)
                await updateBidsForUserById_server(data.users, data.product)

                io.in(data.room).emit('respone_bids', upBids.bids)
            }
        })

        socket.on('buy_now', (data) => {
            socket.broadcast.emit('respone_buy_now', data)
        })

    })
}
export default startWebsocket
