const PersonalMessage = require("../models/PersonalMessage");
const User = require("../models/User");

/**
 * Admin/debug: Get ALL personal messages
 */
const getPersonalMessage = async (req, res) => {
  try {
    const messages = await PersonalMessage.find({})
      .populate("sender", "name role team")
      .populate("receiver", "name role team")
      .populate("team", "name")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
      message: "All Personal Chats Retrieved Successfully...",
    });
  } catch (err) {
    console.error("Error fetching personal messages:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Get chat history BETWEEN two users
 * Optional team filter via query (?teamId=xxx) to enforce same-team
 */
const getPersonalChat = async (req, res) => {
  try {
    const { userId, receiverId } = req.params;
    const { teamId } = req.query;

    const criteria = {
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    };

    if (teamId) criteria.team = teamId;

    const messages = await PersonalMessage.find(criteria)
      .populate("sender", "name role team")
      .populate("receiver", "name role team")
      .populate("team", "name")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: Array.isArray(messages) ? messages : [], // ✅ ensure always array
      message: "Personal Chat Retrieved Successfully...",
    });
  } catch (err) {
    console.error("Error fetching personal chat:", err);
    res.status(500).json({
      success: false,
      data: [], // ✅ still return empty array on error
      message: "Internal Server Error",
    });
  }
};


/**
 * Get all DMs for a TEAM (useful for support inbox)
 */
const getTeamDMs = async (req, res) => {
  try {
    const { teamId } = req.params;

    const messages = await PersonalMessage.find({ team: teamId })
      .populate("sender", "name role team")
      .populate("receiver", "name role team")
      .populate("team", "name")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
      message: "Team Personal Chats Retrieved Successfully...",
    });
  } catch (err) {
    console.error("Error fetching team personal chat:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Create personal message (employee ↔ support), team-wise
 * Validates that both users belong to the same team.
 */
const createPersonalMessage = async (req, res) => {
  try {
    const { sender, receiver, message, team } = req.body;

    if (!sender || !receiver || !message) {
      return res.status(400).json({ success: false, message: "sender, receiver, message are required" });
    }

    // Load users to verify team
    const [senderDoc, receiverDoc] = await Promise.all([
      User.findById(sender).populate("team", "name"),
      User.findById(receiver).populate("team", "name"),
    ]);

    if (!senderDoc || !receiverDoc) {
      return res.status(404).json({ success: false, message: "Sender or Receiver not found" });
    }

    // Determine team to enforce team-wise DM
    let teamId = team;
    if (!teamId) {
      // derive team if not provided
      const sTeam = senderDoc.team?._id?.toString();
      const rTeam = receiverDoc.team?._id?.toString();
      if (!sTeam || !rTeam || sTeam !== rTeam) {
        return res.status(400).json({
          success: false,
          message: "Sender and receiver must belong to the same team (or provide a valid teamId).",
        });
      }
      teamId = sTeam;
    } else {
      // validate both users are in the supplied team
      const sTeam = senderDoc.team?._id?.toString();
      const rTeam = receiverDoc.team?._id?.toString();
      if (!sTeam || !rTeam || sTeam !== teamId || rTeam !== teamId) {
        return res.status(400).json({
          success: false,
          message: "Provided teamId does not match both users' team.",
        });
      }
    }

    const newPersonalMessage = await PersonalMessage.create({
      sender,
      receiver,
      message,
      team: teamId,
    });

    const populated = await newPersonalMessage
      .populate("sender", "name role team")
      .populate("receiver", "name role team")
      .populate("team", "name");

    res.status(201).json({
      success: true,
      message: "Personal Message Created Successfully...",
      data: populated,
    });
  } catch (err) {
    console.error("Error creating personal message:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  getPersonalMessage,
  getPersonalChat,
  getTeamDMs,
  createPersonalMessage,
};


// const PersonalMessage = require("../models/PersonalMessage");

// const getPersonalMessage = async (req, res) => {
//   try {
//     const messages = await PersonalMessage.find().populate("sender", "receiver");
//     res.status(200).json({
//       success: true,
//       data: messages,
//       message: "All Personal Chat Retrived Successfully...",
//     });
//   } catch (err) {
//     console.error("Error fetching group message:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// // ✅ Get chat history between two users
// const getPersonalChat = async (req, res) => {
//   try {
//     const { userId, receiverId } = req.params;

//     const messages = await PersonalMessage.find({
//       $or: [
//         { sender: userId, receiver: receiverId },
//         { sender: receiverId, receiver: userId },
//       ],
//     })
//       .populate("sender", "name")
//       .populate("receiver", "name")
//       .sort({ createdAt: 1 });

//     res.status(200).json({
//       success: true,
//       data: messages,
//       message: "Personal Chat Retrieved Successfully...",
//     });
//   } catch (err) {
//     console.error("Error fetching personal chat:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// const createPersonalMessage = async (req, res) => {
//   try {
//     const { sender, receiver, message, team } = req.body
//     const newPersonalMessage = new PersonalMessage({
//       sender, receiver, message, team
//     })
//     await newPersonalMessage.save()
//     res.status(200).json({
//       success: true,
//       message: "Personal Message Created Successfully...",
//       data: newPersonalMessage
//     })
//   } catch (err) {
//     console.log("Internal Server Error")
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error"
//     })
//   }
// }

// module.exports = { getPersonalMessage, getPersonalChat, createPersonalMessage }