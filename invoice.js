const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
module.exports = router;
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const moment = require('moment');
const fs = require('fs');



router.get('/:invoiceId', invoiceController.getInvoiceById);
router.post('/', invoiceController.createInvoice);
router.put('/:invoiceId', invoiceController.updateInvoice);
router.delete('/:invoiceId', invoiceController.deleteInvoice);

router.post('/:invoiceId/send-email', async (req, res) => {
    try {
        const invoiceId = req.params.invoiceId;
        const { email } = req.body;

        // Fetch invoice details from database
        const invoice = await invoiceController.getInvoiceById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Generate PDF
        const pdfPath = await pdfGenerator.generateInvoicePDF(invoice);

        // Send email with PDF attachment
        await emailService.sendEmailWithAttachment(email, 'Your Invoice', 'Please find your invoice attached.', pdfPath);

        // Optionally delete the PDF after sending the email
        fs.unlinkSync(pdfPath);

        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending email' });
    }