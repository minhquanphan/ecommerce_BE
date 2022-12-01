const bcrypt = require("bcryptjs/dist/bcrypt");
const { catchAsync, sendResponse, AppError } = require("../helpers/utils");
const Cart = require("../models/Cart");
const User = require("../models/User");

// 1. User can create account with email and password ✅
// 2. User can login with email and password ✅
// 3. Owner can update own account profile ✅
// 4. Owner can see own account profile ✅
// 5. Current user can see list of orders
// 6. Users can change password ✅
// 7. Users can checkout and pay for cart
// 8. Users can top-up balance

const userController = {};

userController.register = catchAsync(async (req, res, next) => {
  let { name, email, password, role } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    throw new AppError(409, "already registered", "login failed");
  }
  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);
  user = await User.create({ name, email, password, role });
  return sendResponse(res, 200, true, { user }, null, "success");
});

userController.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(409, "Incorect credentials", "login failed");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(400, "Invalid password", "Login Error");
  }
  const accessToken = user.generateToken();
  return sendResponse(res, 200, true, { user, accessToken }, null, "Success");
});

userController.updateProfile = catchAsync(async (req, res, next) => {
  const { currentUserId } = req;
  const currentUser = await User.findById(currentUserId);
  if (!currentUser) {
    throw new AppError(404, "User not found", "Error");
  }
  const allows = ["name", "gender"];
  allows.forEach((field) => {
    if (req.body[field] !== undefined) {
      currentUser[field] = req.body[field];
    }
  });
  await currentUser.save();
  return sendResponse(res, 200, true, { currentUser }, null, "Success");
});

userController.changePassword = catchAsync(async (req, res, next) => {
  const { currentUserId } = req;
  const { password } = req.body;
  let currentUser = await User.findById(currentUserId);
  if (!currentUser) {
    throw new AppError(404, "User not found", "Error");
  }
  const salt = await bcrypt.genSalt(10);
  const newPassword = await bcrypt.hash(password, salt);
  currentUser = await User.findByIdAndUpdate(
    currentUserId,
    { password: newPassword },
    { new: true }
  );
  return sendResponse(res, 200, true, { currentUser }, null, "Success");
});

userController.paymentCart = catchAsync(async (req, res, next) => {
  const { currentUserId } = req;
  const { cartId } = req.params;

  let currentUser = await User.findById(currentUserId);

  //find the order to pay
  let cartPending = await Cart.findOne({
    _id: cartId,
    author: currentUserId,
    status: "pending",
    isDeleted: false,
  });

  if (!cartPending) {
    throw new AppError(402, "No pending order found", "error");
  }

  let total = cartPending.total;
  let balance = currentUser.balance;

  //check balance
  if (total > balance) {
    throw new AppError(403, "Balance not enough", "Top up now");
  }

  //update new balance
  currentUser = await User.findByIdAndUpdate(
    { _id: currentUserId },
    { balance: balance - total }
  );

  //update new order
  cartPending = await Cart.findByIdAndUpdate(
    {
      _id: cartId,
    },
    { status: "paid" },
    { new: true }
  );

  return sendResponse(res, 200, true, { cartPending }, null, "Payment Success");
});

module.exports = userController;
