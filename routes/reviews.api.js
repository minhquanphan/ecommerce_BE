const express = require("express");
const { body, param } = require("express-validator");
const {
  createReview,
  edit,
  remove,
} = require("../controllers/review.controllers");
const { loginRequired } = require("../middlewares/authentication");
const { checkObjectId, validate } = require("../middlewares/validator");
const router = require("./carts.api");

router.post(
  "/create/review",
  loginRequired,
  validate([
    body("productId").exists().isString().custom(checkObjectId),
    body("rating").exists(),
    body("content").exists().isString(),
  ]),
  createReview
);

router.put(
  "/:reviewId/edit",
  loginRequired,
  validate([
    param("reviewId").exists().isString().custom(checkObjectId),
    body("content").exists().isString(),
  ]),
  edit
);

router.delete(
  "/:reviewId/remove",
  loginRequired,
  validate([param("reviewId").exists().isString().custom(checkObjectId)]),
  remove
);

module.exports = router;
