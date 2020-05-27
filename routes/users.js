const express = require("express");
const Joi = require("@hapi/joi");
const config = require("config");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const usersString = fs.readFileSync("auth/users.json");
const users = JSON.parse(usersString);

router.get("/", [auth, admin], (req, res) => {
  const usersCollection = users.map((v) => {
    return { email: v.email, isAdmin: v.isAdmin };
  });
  res.send(usersCollection);
});

router.post("/", [auth, admin], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = users.find((v) => v.email === req.body.email);
  if (user) return res.status(400).send("User already registered.");

  user = _.pick(req.body, ["email", "password", "isAdmin"]);
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  users.push(user);
  fs.writeFileSync("auth/users.json", JSON.stringify(users));

  const token = generateAuthToken(user);

  res.header("x-auth-token", token).send(_.pick(user, ["email", "isAdmin"]));
});

function generateAuthToken(user) {
  const token = jwt.sign(
    _.pick(user, ["email", "isAdmin"]),
    config.get("jwtPrivateKey")
  );

  return token;
}

function validate(user) {
  const schema = Joi.object({
    email: Joi.string().required().email().min(5).max(255),
    password: Joi.string().min(5).max(255).required(),
    isAdmin: Joi.boolean().required(),
  });

  return schema.validate(user);
}

module.exports = router;
