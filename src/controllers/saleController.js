const Sales = require("../models/Sales");
const User = require("../models/User");
const cloudinary = require("../config/cloudinaryConfig");
const mongoose = require("mongoose");

// const createSale = async (req, res) => {
//   try {
//     const {
//       customer,
//       service,
//       saleItems,
//       paymentMethod,
//       assignedEmployee,
//       status,
//     } = req.body;

//     let paymentProofUrl = "";
//     const parsedSaleItems = JSON.parse(saleItems);

//     const totalAmountPrice = parsedSaleItems.reduce(
//       (sum, item) => sum + item.amount,
//       0
//     );

//     if (req.file) {
//       const uploadedImage = await cloudinary.uploader.upload_stream(
//         {
//           folder: "sales/paymentProofs",
//           use_filename: true,
//           unique_filename: false,
//         },
//         async (error, result) => {
//           if (error)
//             return res
//               .status(500)
//               .json({ success: false, message: error.message });

//           paymentProofUrl = result.secure_url;

//           const newSale = new Sales({
//             customer,
//             service,
//             saleItems: JSON.parse(saleItems),
//             paymentProof: paymentProofUrl,
//             paymentMethod,
//             assignedEmployee,
//             totalAmount: totalAmountPrice,
//             status,
//           });

//           await newSale.save();

//           res.status(200).json({
//             success: true,
//             message: "Sale Created Successfully",
//             data: newSale,
//           });
//         }
//       );
//       uploadedImage.end(req.file.buffer);
//     } else {
//       return res
//         .status(400)
//         .json({ success: false, message: "No file uploaded" });
//     }
//   } catch (err) {
//     console.log("ERROR !", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

const createSale1 = async (req, res) => {
  try {
    const {
      customer,
      service,
      saleItems,
      paymentMethod,
      assignedEmployee,
      paymentProof,
      status,
    } = req.body;

    const parsedSaleItems = JSON.parse(saleItems);
    const totalAmountPrice = parsedSaleItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const newSale = new Sales({
      customer,
      service,
      saleItems: parsedSaleItems,
      paymentMethod,
      assignedEmployee,
      totalAmount: totalAmountPrice,
      status,
      paymentProof
    });

    await newSale.save();
    const io = req.app.get("io");

    io.emit("new-sale", {
      message: "A new sale has been created!",
      saleId: newSale._id,
      assignedEmployee: newSale.assignedEmployee._id,
    });

    res.status(200).json({
      success: true,
      message: "Sale Created Successfully",
      data: newSale,
    });
  } catch (err) {
    console.log("ERROR!", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}; 

const createSale = async (req, res) => {
  try {
    const {
      customer,
      service,
      saleItems,
      paymentMethod,
      assignedEmployee,
      status,
    } = req.body;

    const parsedSaleItems = JSON.parse(saleItems);
    const totalAmountPrice = parsedSaleItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // ⬇️ Step 1: Upload image(s) to Cloudinary
    let uploadedImageUrls = [];

    if (req.files?.paymentProof?.length > 0) {
      uploadedImageUrls = await Promise.all(
        req.files.paymentProof.map((file) =>
          uploadBufferToCloudinary(file.buffer, file.originalname, "image")
        )
      );
    }

    const newSale = new Sales({
      customer,
      service,
      saleItems: parsedSaleItems,
      paymentMethod,
      assignedEmployee,
      totalAmount: totalAmountPrice,
      status,
      paymentProof: uploadedImageUrls,
    });

    await newSale.save();

    const io = req.app.get("io");

    io.emit("new-sale", {
      message: "A new sale has been created!",
      saleId: newSale._id,
      assignedEmployee: newSale.assignedEmployee._id,
    });

    res.status(200).json({
      success: true,
      message: "Sale Created Successfully",
      data: newSale,
    });
  } catch (err) {
    console.error("Create Sale Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const getAllSale = async (req, res) => {
  try {
    const sales = await Sales.find()
      .populate({
        path: "assignedEmployee",
        select: "_id name role team",
        populate: {
          path: "team",
          select: "_id name description",
        },
      })
      .populate({
        path: "customer",
        // select: "_id name role"
      })
      .populate({
        path: "saleItems",
        // select: "_id name role"
      });
    res.status(200).json({
      success: true,
      message: `Sale retrived Successfully`,
      data: sales,
    });
  } catch (err) {
    console.log("ERROR !", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getSaleByEmp = async (req, res) => {
  try {
    const empId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await Sales.countDocuments({ assignedEmployee: empId });

    const services = await Sales.find({ assignedEmployee: empId })
      .populate({
        path: "customer",
        select: "_id name email phone address team",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!services) {
      return res.status(404).json({
        success: false,
        message: "No services found for this employee",
      });
    }

    res.status(200).json({
      success: true,
      message: "All Services retrieved Based on Employee successfully",
      data: services,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error! ${err.message}`,
    });
  }
};

const getSalesByTeam = async (req, res) => {
  try {
    const teamId = req.params.id?.trim();

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Team ID",
      });
    }

    const teamObjectId = new mongoose.Types.ObjectId(String(teamId));

    const allAgents = await User.find({ role: "sales_agent" });

    const teamAgents = allAgents.filter((user) =>
      user.team?.equals(teamObjectId)
    );
    const userIds = teamAgents.map((user) => user._id);

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found in this team",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: 1,
          totalPages: 0,
          perPage: 10,
        },
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const preCount = await Sales.countDocuments({
      assignedEmployee: { $in: userIds },
    });

    const pipeline = [
      {
        $match: {
          assignedEmployee: { $in: userIds },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "assignedEmployee",
          foreignField: "_id",
          as: "assignedEmployee",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "teams",
          localField: "assignedEmployee.team",
          foreignField: "_id",
          as: "assignedEmployee.team",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee.team",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Sales.aggregate(pipeline);
    // console.log("Aggregated Sales Result:", result);

    const teamSales = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    if (teamSales.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No sales found for this team",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
          perPage: limit,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sales retrieved based on team successfully",
      data: teamSales,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Internal Server Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getTeamPendingSale = async (req, res) => {
  try {
    const teamId = req.params.id?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const allActivations = await Sales.find()
      .populate("customer")
      .populate("assignedEmployee");

    const filtered = allActivations.filter(
      (activation) =>
        activation.assignedEmployee?.team?._id?.toString() === teamId &&
        activation.activation === "pending"
    );

    // const total = filtered.length;

    // const paginated = filtered.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      message: "Filtered activations retrieved",
      data: filtered,
      pagination: {
        totalItems: filtered.length,
      },
    });
  } catch (err) {
    console.error("Error fetching activations:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateSale1 = async (req, res) => {
  try {
    const saleId = req.params.id;
    const updateData = req.body;

    const sale = await Sales.findById(saleId);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    if (req.files && req.files.length > 0) {
      const deletePromises = (sale.paymentProof || []).map((url) => {
        const parts = url.split("/");
        console.log("delete file path :", parts);
        const fileName = parts[parts.length - 1].split(".")[0];
        const publicId = `sales/paymentProofs/${fileName}`;
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);

      const uploadBufferToCloudinary = (buffer, originalname) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "sales/paymentProofs",
              use_filename: true,
              public_id: originalname.split(".")[0],
              unique_filename: false,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );
          stream.end(buffer);
        });
      };

      const uploadedUrls = await Promise.all(
        req.files.map((file) =>
          uploadBufferToCloudinary(file.buffer, file.originalname)
        )
      );

      updateData.paymentProof = uploadedUrls;
    }

    const updatedSale = await Sales.findByIdAndUpdate(saleId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: updatedSale,
    });
  } catch (err) {
    console.error("Update Sale Error:", err);
    res.status(500).json({
      success: false,
      message: `Error! ${err.message}`,
    });
  }
};

const updateSale = async (req, res) => {
  try {
    const saleId = req.params.id;
    const updateData = req.body;

    const sale = await Sales.findById(saleId);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // ✅ Always parse saleItems
    const parsedSaleItems = typeof req.body.saleItems === 'string'
      ? JSON.parse(req.body.saleItems)
      : req.body.saleItems;

    updateData.saleItems = parsedSaleItems; // ✅ move here so it's always applied

    // Step 1: Handle Image File Upload (paymentProof)
    if (req.files?.paymentProof?.length > 0) {
      const deletePromises = (sale.paymentProof || []).map((url) => {
        const parts = url.split("/");
        const fileName = parts[parts.length - 1].split(".")[0];
        const publicId = `sales/paymentProofs/${fileName}`;
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);

      const uploadedImageUrls = await Promise.all(
        req.files.paymentProof.map((file) =>
          uploadBufferToCloudinary(file.buffer, file.originalname, "image")
        )
      );

      updateData.paymentProof = uploadedImageUrls;
    }

    // Step 2: Handle Audio File Upload (voiceNote)
    if (req.files?.voiceProof?.length > 0) {
      const audioFile = req.files.voiceProof[0];

      const uploadedAudioUrl = await uploadBufferToCloudinary(
        audioFile.buffer,
        audioFile.originalname,
        "audio"
      );

      updateData.voiceProof = uploadedAudioUrl; // Save as string
    }

    const updatedSale = await Sales.findByIdAndUpdate(saleId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: updatedSale,
    });
  } catch (err) {
    console.error("Update Sale Error:", err);
    res.status(500).json({
      success: false,
      message: `Error! ${err.message}`,
    });
  }
};


// Upload function supporting both image & audio
const uploadBufferToCloudinary = (buffer, originalname, type = "image") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: type === "audio" ? "sales/voiceNotes" : "sales/paymentProofs",
        use_filename: true,
        public_id: originalname.split(".")[0],
        unique_filename: false,
        resource_type: type === "audio" ? "video" : "image", // Audio uploads require "video"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// const updateSale = async (req, res) => {
//   try {
//     const saleId = req.params.id;
//     const updateData = req.body;
//     const sale = await Sales.find({ saleId });

//     if (!sale) {
//       return res.status(404).json({
//         success: false,
//         message: `Sale not found`,
//       });
//     }

//     const updateSale = await Sales.findByIdAndUpdate(saleId, updateData, {
//       new: true,
//       runValidators: true,
//     });
//     res.status(200).json({
//       success: true,
//       message: "Sale update successfully",
//       data: updateSale,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       success: false,
//       message: `Error! ${err.message}`,
//     });
//   }
// };

const deleteSale = async (req, res) => {
  try {
    const saleId = req.params.id;
    const deletedSale = await Sales.findByIdAndDelete(saleId);

    res.status(200).json({
      success: true,
      message: "Sale delete successfully",
      data: deletedSale,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error! ${err.message}`,
    });
  }
};

module.exports = {
  createSale,
  getAllSale,
  getSaleByEmp,
  getTeamPendingSale,
  updateSale,
  deleteSale,
  getSalesByTeam,
};
