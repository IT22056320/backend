const mongoose = require('mongoose');

const connectDB = async()=>{
    return mongoose.connect("mongodb+srv://staticcodeanalyzer:qeW3qhBac6nxhite@cluster0.kvtf0.mongodb.net/analyzerwhole_db?retryWrites=true&w=majority&appName=Cluster0")
    .then(()=>console.log(`connection to database established...`))
    .catch((err)=>console.log(err));
};

module.exports = connectDB;