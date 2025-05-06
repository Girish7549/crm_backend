const PersonalMessage = require("../models/PersonalMessage");

const getPersonalMessage = async (req, res) => {
  try {
    const messages = await PersonalMessage.find().populate("sender", "receiver");
    res.status(200).json({
      success: true,
      data: messages,
      message: "All Personal Chat Retrived Successfully...",
    });
  } catch (err) {
    console.error("Error fetching group message:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createPersonalMessage = async (req, res) =>{
  try{
    const {sender, receiver, message, team} = req.body
    const newPersonalMessage = new PersonalMessage({
      sender, receiver, message, team
    })
    await newPersonalMessage.save()
    res.status(200).json({
      success: true, 
      message: "Personal Message Created Successfully...",
      data: newPersonalMessage
    })
  }catch(err){
    console.log("Internal Server Error")
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    })
  }
}

module.exports = {getPersonalMessage, createPersonalMessage}