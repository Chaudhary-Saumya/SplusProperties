const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, 'Please add a setting key'],
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Please add a setting value']
    },
    description: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', SettingSchema);
