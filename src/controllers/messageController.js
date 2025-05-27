const Message = require("../models/Message");

const getMessage = async (req, res) => {
  try {
    const messages = await Message.find().populate("sender", "name");
    res.status(200).json({
      success: true,
      data: messages,
      message: "All Group Chat Retrived Successfully...",
    });
  } catch (err) {
    console.error("Error fetching group message:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createMessage = async (req, res) => {
  try {
    const { sender, content } = req.body;
    const message = await Message.create({ sender, content });

    res.status(200).json({
      success: true,
      data: message,
      message: "All Group Chat Retrived Successfully...",
    });
  } catch (err) {
    console.error("Error fetching group message:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedMessage = await Message.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Delete Message Successfully....",
      data: deletedMessage,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { getMessage, createMessage, deleteMessage };
