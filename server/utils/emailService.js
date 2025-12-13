import nodemailer from "nodemailer";

// Create reusable transporter (singleton pattern)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Helper to format order items for email
const formatOrderItems = (items) => {
  return items
    .map((item) => {
      const features = [];
      if (item.isLogoTexture && item.logoDecal) features.push("Front Logo");
      if (item.hasBackLogo && item.backLogoDecal) features.push("Back Logo");
      if (item.isFullTexture && item.fullDecal) features.push("Full Texture");

      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.designName}</strong><br>
          <span style="color: #666; font-size: 13px;">${
            item.shirtType || "T-Shirt"
          }</span><br>
          ${
            features.length > 0
              ? `<span style="color: #888; font-size: 12px;">${features.join(
                  ", "
                )}</span>`
              : ""
          }
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          $${item.price}
        </td>
      </tr>
    `;
    })
    .join("");
};

// Main function to send order confirmation email
export const sendOrderConfirmation = async ({
  customerEmail,
  customerName,
  orderDetails,
}) => {
  try {
    const transporter = createTransporter();

    const { items, total, orderDate, shippingAddress } = orderDetails;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: "Order Confirmed! 🎉 We'll Contact You Shortly",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0a0a0a; color: white; padding: 30px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
            .order-table th { background: #0a0a0a; color: white; padding: 12px; text-align: left; }
            .total-row { font-weight: bold; font-size: 18px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #0a0a0a; color: white; padding: 12px 30px; text-decoration: none; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Order Confirmed!</h1>
            </div>
            
            <div class="content">
              <h2>Hey ${customerName}! 👋</h2>
              <p>Thanks for your order! We've received your custom t-shirt design and our team will reach out to you shortly to confirm details and arrange delivery.</p>
              
              <h3>📦 Order Details</h3>
              <p><strong>Order Date:</strong> ${new Date(
                orderDate
              ).toLocaleDateString()}</p>
              
              <table class="order-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${formatOrderItems(items)}
                  <tr class="total-row">
                    <td colspan="2" style="padding: 15px; text-align: right;">Total:</td>
                    <td style="padding: 15px; text-align: right;">$${total}</td>
                  </tr>
                </tbody>
              </table>
              
              <h3>🚚 Shipping Address</h3>
              <p style="background: white; padding: 15px; border-left: 4px solid #0a0a0a;">
                ${shippingAddress.replace(/\n/g, "<br>")}
              </p>
              
              <h3>⏱️ What's Next?</h3>
              <ul>
                <li>Our team will review your order within 24 hours</li>
                <li>We'll contact you via phone to confirm details</li>
                <li>Production typically takes 5-7 business days</li>
                <li>You'll receive a shipping notification once dispatched</li>
              </ul>
              
              <div style="margin-top: 30px; text-align: center; padding: 20px; background: white; border-radius: 8px;">
                <p style="margin-bottom: 15px; color: #333;">Have questions? Message us on WhatsApp!</p>
               <a href="https://wa.me/${
                 process.env.WHATSAPP_NUMBER || "1234567890"
               }?text=Hi!%20I%20have%20a%20question%20about%20my%20order"
                   style="display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                  <span style="font-size: 20px;">💬</span> Chat on WhatsApp
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated message from ${
                process.env.EMAIL_FROM_NAME
              }</p>
              <p>© ${new Date().getFullYear()} All rights reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${customerEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    // Don't throw - we don't want email failure to break checkout
    return { success: false, error: error.message };
  }
};

// Optional: Send admin notification
export const sendAdminNotification = async (orderDetails) => {
  try {
    const transporter = createTransporter();

    const { customerName, customerEmail, items, total, phoneNumber } =
      orderDetails;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: `🆕 New Order from ${customerName}`,
      html: `
        <h2>New Order Received!</h2>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Phone:</strong> ${phoneNumber}</p>
        <p><strong>Total:</strong> $${total}</p>
        <p><strong>Items:</strong> ${items.length}</p>
        <p>Check your admin panel for full details.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Admin notification sent");
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
  }
};
