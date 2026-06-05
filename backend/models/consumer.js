const mongoose = require('mongoose');
const crypto = require('crypto');

const consumerSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        required : true,
    },
    phone : {
        type : Number,
        required : true,
    },
    hash : {
        type : String,
        required : true,
    },
    salt : {
        type : String,
        required : true 
    },
    address : {
        type : String,
    },
    refreshToken : {
        type : String,
        default : null
    }
},{})

consumerSchema.methods.setPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password,this.salt,1000,64,'sha512').toString('hex'); //Last parameter is Hashing algorithm
}

consumerSchema.methods.validatePassword = function(password){
    var hash = crypto.pbkdf2Sync(password,this.salt,1000,64,`sha512`).toString('hex');
    return this.hash===hash;
}

const Consumer = mongoose.model("Consumer",consumerSchema);

module.exports = Consumer;