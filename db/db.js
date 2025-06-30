import mongoose from "mongoose";

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Mongo Databse Connect Hogaya aage kaam karle yahan masla nahi hai !");
        
    } catch(error) {
        console.log(error, "Mongo Databse Connect Nahi hoa yahein par masla nahi hai !")
    }
}

export default connectToDatabase