const mongoose = require("mongoose");
const SetUpschema = new mongoose.Schema({
    businessName: { type: String, required: true },
    businessType: { type: String, required: true },
    businessPhone: { type: String, required: true },
    businessAddress: { type: String, required: true },
    businessDescription: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    accountNumber: { type: String, required: true },
    confirmAccountNumber: { type: String, required: true },
    accountType: { type: String, required: true },
    bankName: { type: String, required: true },
    ifscCode: { type: String, required: true },
    panNumber: { type: String, required: true },
    taxId: { type: String, required: true },
    currency: { type: String, required: true },
    timeZone: { type: String, required: true }
});

module.exports = mongoose.models.Setup || mongoose.model("Setup", SetUpschema);