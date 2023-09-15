const base = "https://api-m.sandbox.paypal.com";
import fetch from "node-fetch";
import { updatePaid } from "./productController.js";
const generateAccessToken = async () => {
    try {
        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }
        const auth = Buffer.from(
            process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_CLIENT_SECRET,
        ).toString("base64");

        const response = await fetch(`${base}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const data = await response.json();

        return data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error);
    }
};


const createOrderByPayPal = async (data) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: data.price,
                },
            },
        ],
    };

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    return handleResponseByPayPal(response);
};


const captureOrderByPayPal = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return handleResponseByPayPal(response);
};

async function handleResponseByPayPal(response) {
    try {
        const jsonResponse = await response.json();
        return {
            jsonResponse,
            httpStatusCode: response.status,
        };
    } catch (err) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
}

// handle api
const createOrderByPayPalController = async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        // const { name, id, price } = req.body;
        const { price } = req.body;
        const { jsonResponse, httpStatusCode } = await createOrderByPayPal({ price });
        return res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        return res.status(500).json({ error: "Failed to create order." });
    }
}

const captureOrderByPayPalController = async (req, res) => {
    try {
        const { orderID } = req.params;
        const { productId } = req.body
        const { jsonResponse, httpStatusCode } = await captureOrderByPayPal(orderID);
        if (httpStatusCode === 201) {
            const save = await updatePaid(productId)
            if (save) {
                return res.status(httpStatusCode).json(jsonResponse);
            }
        }
        return res.status(400).json({ error: "Failed to save" });
    } catch (error) {
        console.error("Failed to create order:", error);
        return res.status(500).json({ error: "Failed to capture order." });
    }
}

export { createOrderByPayPalController, captureOrderByPayPalController }