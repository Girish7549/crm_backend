const FollowUp = require("../models/FollowUp");

const createFollowUp = async (req, res) => {
  try {
    const { email, salesPerson } = req.body;

    const existingFollowUp = await FollowUp.findOne({ email });

    if (existingFollowUp) {
      if (existingFollowUp.salesPerson) {
        return res.status(400).json({
          success: false,
          message: "Follow-up already created and assigned to a salesperson.",
          data: existingFollowUp,
        });
      } else {
        existingFollowUp.salesPerson = salesPerson;
        existingFollowUp.expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await existingFollowUp.save();
        return res.status(200).json({
          success: true,
          message: "Follow-up updated with new salesperson.",
          followUp: existingFollowUp,
        });
      }
    }

    const newFollowUp = new FollowUp(req.body);
    await newFollowUp.save();

    res.status(201).json({
      success: true,
      message: "Follow-up created successfully.",
      followUp: newFollowUp,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllFollowUps = async (req, res) => {
  try {
    const followUps = await FollowUp.find().populate("salesPerson");
    res.status(200).json({ success: true, followUps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFollowUpById = async (req, res) => {
  try {
    const followUp = await FollowUp.find({
      salesPerson: req.params.id,
    })
      .populate("salesPerson")
      .populate({
        path: "notes.employee",
        model: "User",
        select: "id name email",
      });
    if (!followUp)
      return res
        .status(404)
        .json({ success: false, message: "Follow-up not found" });
    res.status(200).json({ success: true, data: followUp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFollowUp = async (req, res) => {
  try {
    const { notes, salesPerson } = req.body;
    const followUp = await FollowUp.findById(req.params.id);
    if (!followUp)
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    if (notes && notes.length > 0) {
      await FollowUp.findByIdAndUpdate(
        req.params.id,
        {
          $push: { notes: notes[0] },
          ...(salesPerson && { $set: { salesPerson } }),
        },
        { new: true, runValidators: true }
      );
    } else {
      await FollowUp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndDelete(req.params.id);
    if (!followUp)
      return res
        .status(404)
        .json({ success: false, message: "Follow-up not found" });
    res.status(200).json({ success: true, message: "Follow-up deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// const todayTotalRemaningFollowUps = async (req, res) => {
//   const empId = req.params.id
//   const followUps = await FollowUp.find({ salesPerson: empId })

// }

module.exports = {
  createFollowUp,
  getAllFollowUps,
  getFollowUpById,
  deleteFollowUp,
  updateFollowUp,
  // todayTotalRemaningFollowUps,
};
