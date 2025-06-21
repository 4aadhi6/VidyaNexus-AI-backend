// // =================================================================
// //  VidyaNexus AI - All-in-One Backend Server
// // =================================================================

// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { v2 as cloudinary } from "cloudinary";
// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";

// // =================================================================
// //  1. INITIAL SETUP & CONFIGURATIONS
// // =================================================================

// dotenv.config();
// const app = express();

// // --- Database Connection ---
// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`DB Error: ${error.message}`);
//     process.exit(1);
//   }
// };
// connectDB();

// // --- Cloudinary Configuration ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // --- Core Middleware ---
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // =================================================================
// //  2. MONGOOSE MODELS
// // =================================================================

// // --- User Model ---
// const userSchema = mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: {
//       type: String,
//       required: true,
//       enum: ["user", "helper", "admin"],
//       default: "user",
//     },
//   },
//   { timestamps: true }
// );
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });
// const User = mongoose.model("User", userSchema);

// // --- Subject Model ---
// const subjectSchema = mongoose.Schema(
//   { name: { type: String, required: true, unique: true } },
//   { timestamps: true }
// );
// const Subject = mongoose.model("Subject", subjectSchema);

// // --- Material Model ---
// const materialSchema = mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     subject: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: "Subject",
//     },
//     fileUrl: { type: String, required: true },
//     fileName: { type: String, required: true },
//     uploadedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );
// const Material = mongoose.model("Material", materialSchema);

// // --- Project Model ---
// const projectSchema = mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     description: { type: String, required: true },
//     fileUrl: { type: String, required: true },
//     fileName: { type: String, required: true },
//     uploadedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );
// const Project = mongoose.model("Project", projectSchema);

// // --- Advertisement Model ---
// const adSchema = mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     link: { type: String, required: true },
//     imageUrl: { type: String, required: true },
//   },
//   { timestamps: true }
// );
// const Advertisement = mongoose.model("Advertisement", adSchema);

// // --- Learning Resource Model ---
// const resourceSchema = mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     description: { type: String, required: true },
//     type: { type: String, required: true, enum: ["video", "file"] },
//     link: { type: String },
//     fileUrl: { type: String },
//     fileName: { type: String },
//     uploadedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );
// const LearningResource = mongoose.model("LearningResource", resourceSchema);

// // =================================================================
// //  3. MIDDLEWARE
// // =================================================================

// // --- JWT Token Generation ---
// const generateToken = (id) =>
//   jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// // --- Auth Middleware (Protect Routes) ---
// const protect = async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.id).select("-password");
//       if (!req.user)
//         return res
//           .status(401)
//           .json({ success: false, message: "Not authorized, user not found" });
//       next();
//     } catch (error) {
//       res
//         .status(401)
//         .json({ success: false, message: "Not authorized, token failed" });
//     }
//   } else {
//     res
//       .status(401)
//       .json({ success: false, message: "Not authorized, no token" });
//   }
// };
// const admin = (req, res, next) => {
//   req.user && req.user.role === "admin"
//     ? next()
//     : res
//         .status(403)
//         .json({ success: false, message: "Not authorized as an admin" });
// };
// const adminOrHelper = (req, res, next) => {
//   req.user && (req.user.role === "admin" || req.user.role === "helper")
//     ? next()
//     : res.status(403).json({
//         success: false,
//         message: "Not authorized as an admin or helper",
//       });
// };

// // --- File Upload Middleware (Multer + Cloudinary) ---
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "vidyanexus-uploads",
//     resource_type: "auto",
//     allowed_formats: ["jpeg", "png", "jpg", "pdf", "zip"],
//   },
// });
// const upload = multer({ storage: storage });

// // =================================================================
// //  4. API ROUTES & CONTROLLERS
// // =================================================================

// // --- Health Check Route ---
// app.get("/", (req, res) => res.send("VidyaNexus API is running..."));

// // --- Auth Routes ---
// app.post("/api/v1/auth/login", async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });
//   if (user && (await user.matchPassword(password))) {
//     res.json({
//       success: true,
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         token: generateToken(user._id),
//       },
//     });
//   } else {
//     res
//       .status(401)
//       .json({ success: false, message: "Invalid email or password" });
//   }
// });
// app.post("/api/v1/auth/register", protect, admin, async (req, res) => {
//   const { name, email, password, role } = req.body;
//   const userExists = await User.findOne({ email });
//   if (userExists)
//     return res
//       .status(400)
//       .json({ success: false, message: "User already exists" });
//   const user = await User.create({ name, email, password, role });
//   if (user)
//     res.status(201).json({
//       success: true,
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   else res.status(400).json({ success: false, message: "Invalid user data" });
// });

// // --- Subject Routes ---
// app.get("/api/v1/subjects", async (req, res) => {
//   const subjects = await Subject.find({});
//   res.json({ success: true, data: subjects });
// });
// app.post("/api/v1/subjects", protect, adminOrHelper, async (req, res) => {
//   const { name } = req.body;
//   const subjectExists = await Subject.findOne({ name });
//   if (subjectExists)
//     return res
//       .status(400)
//       .json({ success: false, message: "Subject already exists" });
//   const subject = await Subject.create({ name });
//   res.status(201).json({ success: true, data: subject });
// });
// app.delete("/api/v1/subjects/:id", protect, adminOrHelper, async (req, res) => {
//   const subject = await Subject.findById(req.params.id);
//   if (subject) {
//     await Material.deleteMany({ subject: subject._id });
//     await subject.deleteOne();
//     res.json({
//       success: true,
//       message: "Subject and related materials removed",
//     });
//   } else {
//     res.status(404).json({ success: false, message: "Subject not found" });
//   }
// });

// // --- Material Routes ---
// app.get("/api/v1/materials/subject/:subjectId", async (req, res) => {
//   const subject = await Subject.findById(req.params.subjectId);
//   if (!subject)
//     return res
//       .status(404)
//       .json({ success: false, message: "Subject not found" });
//   const materials = await Material.find({ subject: req.params.subjectId });
//   res.json({ success: true, data: { subject, materials } });
// });
// app.post(
//   "/api/v1/materials",
//   protect,
//   adminOrHelper,
//   upload.single("materialFile"),
//   async (req, res) => {
//     const { title, subject } = req.body;
//     if (!req.file)
//       return res
//         .status(400)
//         .json({ success: false, message: "File is required" });
//     const material = await Material.create({
//       title,
//       subject,
//       fileUrl: req.file.path,
//       fileName: req.file.originalname,
//       uploadedBy: req.user.id,
//     });
//     res.status(201).json({ success: true, data: material });
//   }
// );

// // --- Project Routes ---
// app.get("/api/v1/projects", async (req, res) => {
//   const projects = await Project.find({}).sort({ createdAt: -1 });
//   res.json({ success: true, data: projects });
// });
// app.post(
//   "/api/v1/projects",
//   protect,
//   adminOrHelper,
//   upload.single("projectFile"),
//   async (req, res) => {
//     const { title, description } = req.body;
//     if (!req.file)
//       return res
//         .status(400)
//         .json({ success: false, message: "File is required" });
//     const project = await Project.create({
//       title,
//       description,
//       fileUrl: req.file.path,
//       fileName: req.file.originalname,
//       uploadedBy: req.user.id,
//     });
//     res.status(201).json({ success: true, data: project });
//   }
// );

// // --- Advertisement Routes ---
// app.get("/api/v1/ads", async (req, res) => {
//   const ads = await Advertisement.find({});
//   res.json({ success: true, data: ads });
// });
// app.post(
//   "/api/v1/ads",
//   protect,
//   admin,
//   upload.single("adImage"),
//   async (req, res) => {
//     const { title, link } = req.body;
//     if (!req.file)
//       return res
//         .status(400)
//         .json({ success: false, message: "Image is required" });
//     const ad = await Advertisement.create({
//       title,
//       link,
//       imageUrl: req.file.path,
//     });
//     res.status(201).json({ success: true, data: ad });
//   }
// );
// app.delete("/api/v1/ads/:id", protect, admin, async (req, res) => {
//   const ad = await Advertisement.findById(req.params.id);
//   if (ad) {
//     await ad.deleteOne();
//     res.json({ success: true, message: "Ad removed" });
//   } else {
//     res.status(404).json({ success: false, message: "Ad not found" });
//   }
// });

// // --- Learning Resource Routes ---
// app.get("/api/v1/resources", async (req, res) => {
//   const resources = await LearningResource.find({}).sort({ createdAt: -1 });
//   res.json({ success: true, data: resources });
// });
// app.post(
//   "/api/v1/resources",
//   protect,
//   adminOrHelper,
//   upload.single("resourceFile"),
//   async (req, res) => {
//     const { title, description, type, link } = req.body;
//     try {
//       let newResource;
//       if (type === "file") {
//         if (!req.file)
//           throw new Error("File is required for file type resource.");
//         newResource = await LearningResource.create({
//           title,
//           description,
//           type,
//           fileUrl: req.file.path,
//           fileName: req.file.originalname,
//           uploadedBy: req.user.id,
//         });
//       } else if (type === "video") {
//         if (!link) throw new Error("Link is required for video type resource.");
//         newResource = await LearningResource.create({
//           title,
//           description,
//           type,
//           link,
//           uploadedBy: req.user.id,
//         });
//       } else {
//         throw new Error("Invalid resource type.");
//       }
//       res.status(201).json({ success: true, data: newResource });
//     } catch (error) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }
// );

// // =================================================================
// //  5. ERROR HANDLING MIDDLEWARE (MUST BE LAST)
// // =================================================================

// // --- 404 Not Found ---
// app.use((req, res, next) => {
//   const error = new Error(`Not Found - ${req.originalUrl}`);
//   res.status(404);
//   next(error);
// });

// // --- General Error Handler ---
// app.use((err, req, res, next) => {
//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(statusCode).json({
//     success: false,
//     message: err.message,
//     stack: process.env.NODE_ENV === "production" ? null : err.stack,
//   });
// });

// // =================================================================
// //  6. START THE SERVER
// // =================================================================

// const PORT = process.env.PORT || 8000;

// app.listen(PORT, console.log(`Server running on port ${PORT}`));
// =================================================================
//  VidyaNexus AI - All-in-One Backend Server (with Auto Admin Setup)
// =================================================================

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// =================================================================
//  1. INITIAL SETUP & CONFIGURATIONS
// =================================================================

dotenv.config();
const app = express();

// --- Database Connection ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

// --- Cloudinary Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Core Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =================================================================
//  2. MONGOOSE MODELS
// =================================================================

// --- User Model ---
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["user", "helper", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
const User = mongoose.model("User", userSchema);

// --- Subject Model ---
const subjectSchema = mongoose.Schema(
  { name: { type: String, required: true, unique: true } },
  { timestamps: true }
);
const Subject = mongoose.model("Subject", subjectSchema);

// --- Material Model ---
const materialSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Subject",
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);
const Material = mongoose.model("Material", materialSchema);

// --- Project Model ---
const projectSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);
const Project = mongoose.model("Project", projectSchema);

// --- Advertisement Model ---
const adSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    link: { type: String, required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);
const Advertisement = mongoose.model("Advertisement", adSchema);

// --- Learning Resource Model ---
const resourceSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ["video", "file"] },
    link: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);
const LearningResource = mongoose.model("LearningResource", resourceSchema);

// =================================================================
//  2a. AUTO ADMIN SEEDING
// =================================================================
const createAdminOnStartup = async () => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 0) {
      console.log("No admin account found. Creating a default admin...");
      const adminEmail = process.env.ADMIN_EMAIL || "admin@vidyanexus.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "password123";
      const adminName = "Default Admin";

      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
      console.log("================================================");
      console.log("Default Admin Account Created:");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log("You can now log in with these credentials.");
      console.log("================================================");
    }
  } catch (error) {
    console.error("Error creating default admin user:", error);
    process.exit(1);
  }
};

// =================================================================
//  3. MIDDLEWARE
// =================================================================

// --- JWT Token Generation ---
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// --- Auth Middleware (Protect Routes) ---
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user)
        return res
          .status(401)
          .json({ success: false, message: "Not authorized, user not found" });
      next();
    } catch (error) {
      res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    }
  } else {
    res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
};
const admin = (req, res, next) => {
  req.user && req.user.role === "admin"
    ? next()
    : res
        .status(403)
        .json({ success: false, message: "Not authorized as an admin" });
};
const adminOrHelper = (req, res, next) => {
  req.user && (req.user.role === "admin" || req.user.role === "helper")
    ? next()
    : res.status(403).json({
        success: false,
        message: "Not authorized as an admin or helper",
      });
};

// --- File Upload Middleware (Multer + Cloudinary) ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "vidyanexus-uploads",
    resource_type: "auto",
    allowed_formats: ["jpeg", "png", "jpg", "pdf", "zip"],
  },
});
const upload = multer({ storage: storage });

// =================================================================
//  4. API ROUTES & CONTROLLERS
// =================================================================

// --- Health Check Route ---
app.get("/", (req, res) => res.send("VidyaNexus API is running..."));

// --- Auth Routes ---
app.post("/api/v1/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }
});

// This route is now secure and only accessible by an existing admin
app.post("/api/v1/auth/register", protect, admin, async (req, res) => {
  const { name, email, password, role } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists)
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });
  const user = await User.create({ name, email, password, role });
  if (user)
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  else res.status(400).json({ success: false, message: "Invalid user data" });
});

// --- Subject Routes ---
app.get("/api/v1/subjects", async (req, res) => {
  const subjects = await Subject.find({});
  res.json({ success: true, data: subjects });
});
app.post("/api/v1/subjects", protect, adminOrHelper, async (req, res) => {
  const { name } = req.body;
  const subjectExists = await Subject.findOne({ name });
  if (subjectExists)
    return res
      .status(400)
      .json({ success: false, message: "Subject already exists" });
  const subject = await Subject.create({ name });
  res.status(201).json({ success: true, data: subject });
});
app.delete("/api/v1/subjects/:id", protect, adminOrHelper, async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (subject) {
    await Material.deleteMany({ subject: subject._id });
    await subject.deleteOne();
    res.json({
      success: true,
      message: "Subject and related materials removed",
    });
  } else {
    res.status(404).json({ success: false, message: "Subject not found" });
  }
});

// --- Material Routes ---
app.get("/api/v1/materials/subject/:subjectId", async (req, res) => {
  const subject = await Subject.findById(req.params.subjectId);
  if (!subject)
    return res
      .status(404)
      .json({ success: false, message: "Subject not found" });
  const materials = await Material.find({ subject: req.params.subjectId });
  res.json({ success: true, data: { subject, materials } });
});
app.post(
  "/api/v1/materials",
  protect,
  adminOrHelper,
  upload.single("materialFile"),
  async (req, res) => {
    const { title, subject } = req.body;
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "File is required" });
    const material = await Material.create({
      title,
      subject,
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      uploadedBy: req.user.id,
    });
    res.status(201).json({ success: true, data: material });
  }
);

// --- Project Routes ---
app.get("/api/v1/projects", async (req, res) => {
  const projects = await Project.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: projects });
});
app.post(
  "/api/v1/projects",
  protect,
  adminOrHelper,
  upload.single("projectFile"),
  async (req, res) => {
    const { title, description } = req.body;
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "File is required" });
    const project = await Project.create({
      title,
      description,
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      uploadedBy: req.user.id,
    });
    res.status(201).json({ success: true, data: project });
  }
);

// --- Advertisement Routes ---
app.get("/api/v1/ads", async (req, res) => {
  const ads = await Advertisement.find({});
  res.json({ success: true, data: ads });
});
app.post(
  "/api/v1/ads",
  protect,
  admin,
  upload.single("adImage"),
  async (req, res) => {
    const { title, link } = req.body;
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Image is required" });
    const ad = await Advertisement.create({
      title,
      link,
      imageUrl: req.file.path,
    });
    res.status(201).json({ success: true, data: ad });
  }
);
app.delete("/api/v1/ads/:id", protect, admin, async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (ad) {
    await ad.deleteOne();
    res.json({ success: true, message: "Ad removed" });
  } else {
    res.status(404).json({ success: false, message: "Ad not found" });
  }
});

// --- Learning Resource Routes ---
app.get("/api/v1/resources", async (req, res) => {
  const resources = await LearningResource.find({}).sort({ createdAt: -1 });
  res.json({ success: true, data: resources });
});
app.post(
  "/api/v1/resources",
  protect,
  adminOrHelper,
  upload.single("resourceFile"),
  async (req, res) => {
    const { title, description, type, link } = req.body;
    try {
      let newResource;
      if (type === "file") {
        if (!req.file)
          throw new Error("File is required for file type resource.");
        newResource = await LearningResource.create({
          title,
          description,
          type,
          fileUrl: req.file.path,
          fileName: req.file.originalname,
          uploadedBy: req.user.id,
        });
      } else if (type === "video") {
        if (!link) throw new Error("Link is required for video type resource.");
        newResource = await LearningResource.create({
          title,
          description,
          type,
          link,
          uploadedBy: req.user.id,
        });
      } else {
        throw new Error("Invalid resource type.");
      }
      res.status(201).json({ success: true, data: newResource });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// =================================================================
//  5. ERROR HANDLING MIDDLEWARE (MUST BE LAST)
// =================================================================

// --- 404 Not Found ---
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// --- General Error Handler ---
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// =================================================================
//  6. START THE SERVER & CREATE ADMIN
// =================================================================

const startServer = async () => {
  // First, connect to the database
  await connectDB();
  // Then, check for and create the admin user if needed
  await createAdminOnStartup();

  const PORT = process.env.PORT || 8000;
  app.listen(PORT, console.log(`Server running on port ${PORT}`));
};

startServer();
