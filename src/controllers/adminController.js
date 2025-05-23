const Callback = require('../models/Callback');
const Trial = require('../models/Trial');
const User = require('../models/User');
const Sales = require('../models/Sales');
const FollowUp = require('../models/FollowUp');

const getExecutiveStats = async (req, res) => {
  try {
    const executiveId = req.params.id;

    const emp = await User.findById(executiveId).select('name email phone team').populate('team');

    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // TODAY range
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. All Sales
    const allSales = await Sales.find({ assignedEmployee: executiveId })
      .populate('customer service assignedEmployee')
      .sort({ createdAt: -1 });

    const totalRevenue = allSales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);

    // 2. Recent Sales (last 5–10)
    const recentSales = allSales.slice(0, 10);

    // 3. Follow-ups
    const followUps = await FollowUp.find({ salesPerson: executiveId })
      .populate('salesPerson')
      .sort({ createdAt: -1 });

    // 4. Callbacks
    const callbacks = await Callback.find({ createdBy: executiveId })
      .populate('createdBy')
      .sort({ createdAt: -1 });

    // 5. Trials
    const trials = await Trial.find({ assignedEmployee: executiveId })
      .populate('service assignedEmployee')
      .sort({ createdAt: -1 });

    res.json({
      data: {
        topSection: {
          emp,
          totalRevenue,
          sale: allSales.length,
          recentSale: recentSales.length,
          followUps: followUps.length,
          callback: callbacks.length,
          trial: trials.length,
        },
        sale: allSales,
        recentSale: recentSales,
        followUps,
        callback: callbacks,
        trial: trials,
      },
    });

  } catch (err) {
    console.error('Error in getExecutiveStats:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {getExecutiveStats};
