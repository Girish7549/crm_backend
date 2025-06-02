const mongoose  = require('mongoose')

require('dotenv').config()

const connectDB = async() => {
    try{
        const connect = await mongoose.connect(process.env.DATABASE_URL)
        console.log(`Database connected successfully : ${connect.connection.host} ${connect.connection.name}`)
    }catch(err){
        console.log(err)
        process.exit(1)
    }
}

module.exports = connectDB;