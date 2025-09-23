const FollowUp = require("../models/FollowUp");

const createFollowUp_OLD_working = async (req, res) => {
  try {
    const { email, salesPerson } = req.body;

    const existingFollowUp = await FollowUp.findOne({ email }).populate('salesPerson');

    if (existingFollowUp) {
      if (existingFollowUp.salesPerson) {
        return res.status(400).json({
          success: false,
          message: `Follow-up already created and assigned to ${existingFollowUp.salesPerson.name}.`,
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
const createFollowUp = async (req, res) => {
  try {
    const { email, salesPerson, assignedService, name, phone, address, notes } = req.body;

    // 1️⃣ Check if any followups exist for this email
    const existingFollowUps = await FollowUp.find({ email }).populate("salesPerson");

    if (existingFollowUps.length > 0) {
      // Check if same-service followup already exists
      const sameServiceFollowUp = existingFollowUps.find(
        (f) => String(f.salesPerson?.assignedService) === String(assignedService)
      );

      if (sameServiceFollowUp) {
        if (sameServiceFollowUp.salesPerson) {
          // 🔹 Case 1: Same service + salesPerson already assigned
          return res.status(400).json({
            success: false,
            message: `Follow-up already exists for this email under service, assigned to ${sameServiceFollowUp.salesPerson.name}.`,
            data: sameServiceFollowUp,
          });
        } else {
          // 🔹 Case 2: Same service but salesPerson is null → reassign
          sameServiceFollowUp.salesPerson = salesPerson;
          sameServiceFollowUp.expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await sameServiceFollowUp.save();

          return res.status(200).json({
            success: true,
            message: "Follow-up reassigned to new salesperson.",
            followUp: sameServiceFollowUp,
          });
        }
      }

      // 🔹 Case 3: Different service followup exists → allow new followup creation
      const newFollowUp = new FollowUp({
        name,
        email,
        phone,
        address,
        notes,
        salesPerson,
        assignedService,
      });

      await newFollowUp.save();
      return res.status(201).json({
        success: true,
        message: "New follow-up created for different service.",
        followUp: newFollowUp,
      });
    }

    // 🔹 Case 4: No followup at all → create new
    const newFollowUp = new FollowUp({
      name,
      email,
      phone,
      address,
      notes,
      salesPerson,
      assignedService,
    });

    await newFollowUp.save();
    return res.status(201).json({
      success: true,
      message: "Follow-up created successfully.",
      followUp: newFollowUp,
    });
  } catch (error) {
    console.error("Error creating follow-up:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAllFollowUps = async (req, res) => {
  try {
    const followUps = await FollowUp.find().populate("salesPerson").populate("assignedService");
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

const getFollowUpsByServiceId = async (req, res) => {
  try {
    const id = req.params.id;

    const followUps = await FollowUp.find({ assignedService: id })
      .populate({
        path: "salesPerson",
        select: "id name email assignedService",
      })
      .populate({
        path: "lastSalePerson",
        select: "id name email assignedService",
      })
      .populate({
        path: "notes.employee",
        model: "User",
        select: "id name email",
      });

    if (!followUps || followUps.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No follow-ups found for this Company",
      });
    }

    res.status(200).json({
      success: true,
      count: followUps.length,
      message: "Follow-Ups Download Successfully",
      data: followUps,
    });
  } catch (error) {
    console.error("Error fetching follow-ups by service:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



const updateFollowUp1 = async (req, res) => {
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
const updateFollowUp = async (req, res) => {
  try {
    const { notes, salesPerson } = req.body;
    const followUp = await FollowUp.findById(req.params.id);

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    // Construct update object safely
    let updateQuery = {};

    if (notes && notes.length > 0) {
      updateQuery.$push = { notes: notes[0] };
    }

    if (salesPerson) {
      updateQuery.$set = { salesPerson };
    }

    // If pushing notes or salesPerson only
    if (Object.keys(updateQuery).length > 0) {
      await FollowUp.findByIdAndUpdate(req.params.id, updateQuery, {
        new: true,
        runValidators: true,
      });
    } else {
      // fallback: update full body
      await FollowUp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
    }

    res.status(200).json({ success: true, message: "Follow-up updated" });

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
  getFollowUpsByServiceId,
  deleteFollowUp,
  updateFollowUp,
  // todayTotalRemaningFollowUps,
};
