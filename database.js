const mongoose = require('mongoose');

// connect to Mongo daemon
mongoose.connect(
    // 'mongodb://mongo:27017/expressmongo',
    'mongodb+srv://DevVRGhost:grossevache1&@cluster0.faeme.azure.mongodb.net/vrghost_db?retryWrites=true&w=majority',
    { useNewUrlParser: true },
)
.catch(err => console.log(err))
.then(() => {
    console.log('MongoDB Connected');
});

module.exports = mongoose;
