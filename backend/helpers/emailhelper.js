const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
        
    }
});
transporter.verify(function (error, success) {
    if (error) {
        console.error("❌ SMTP Error:", error);
    } else {
        console.log("✅ SMTP Server is ready");
    }
}); 

const sendOrderConfirmationEmail = async ({
    customerName,
    customerEmail,
    orderNumber,
    items,
    totalAmount,
    paymentMethod,
    shippingAddress
}) => {
    console.log("📧 sendOrderConfirmationEmail() called");
    console.log("Customer Email:", customerEmail);

    const productRows = items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price}</td>
        </tr>
    `).join("");

    const html = `
    <div style="font-family:Arial,sans-serif;padding:20px;max-width:700px;margin:auto;">
        <h2 style="color:#ff6b6b;">🎉 Kiddy Palace</h2>

        <h3>Your Order Has Been Confirmed!</h3>

        <p>Hello <b>${customerName}</b>,</p>

        <p>Thank you for shopping with <b>Kiddy Palace</b>. Your order has been placed successfully.</p>

        <hr>

        <p><b>Order Number:</b> ${orderNumber}</p>
        <p><b>Payment Method:</b> ${paymentMethod.toUpperCase()}</p>
        <p><b>Total Amount:</b> ₹${totalAmount}</p>

        <h3>Products</h3>

        <table border="1" cellspacing="0" cellpadding="8" width="100%">
            <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
            </tr>

            ${productRows}

        </table>

        <h3>Shipping Address</h3>

        <p>
            ${shippingAddress.fullName}<br>
            ${shippingAddress.address}<br>
            ${shippingAddress.city}<br>
            ${shippingAddress.state}<br>
            ${shippingAddress.zipCode}
        </p>

        <br>

        <p>We'll notify you once your order is shipped.</p>

        <h3>Thank you for choosing Kiddy Palace ❤️</h3>

    </div>
    `;

    try {
    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: customerEmail,
        subject: "🎉 Your Kiddy Palace Order is Confirmed!",
        html
    });

    console.log("✅ Email sent successfully!");
    console.log(info);

} catch (err) {
    console.error("❌ Email Error:", err);
}
};

module.exports = {
    sendOrderConfirmationEmail
};