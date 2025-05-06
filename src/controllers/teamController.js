const Team = require("../models/Team");
const User = require("../models/User");

const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    const team = new Team({ name, description });
    await team.save();
    console.log("Team Created:", team);
    res.status(200).json({
      success: true,
      message: "Trial created successfully",
      data: team,
    });
  } catch (err) {
    console.error("Error creating team:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
    res.status(200).json({
        success: true,
        message: 'All Teams Data Received Successfully...',
        data: teams
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    })
  }
};

const assignUsersToTeam = async (teamId, userIds) => {
  try {
    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { team: teamId } }
    );
    console.log("Users assigned to team");
    res.status(200).json({
      success: true,
      message: "Team Assigned successfully",
    });
  } catch (err) {
    console.error("Error assigning users:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = { createTeam, getAllTeams };
