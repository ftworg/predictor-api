const Joi = require("@hapi/joi");
const bcrypt = require("bcrypt");
const config = require("config");
const _ = require("lodash");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");

const usersString = fs.readFileSync("auth/users.json");
const users = JSON.parse(usersString);

function generateAuthToken(user) {
  const token = jwt.sign(
    _.pick(user, ["email", "isAdmin"]),
    config.get("jwtPrivateKey")
  );

  return token;
}

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.message);

  let user = users.find((v) => v.email === req.body.email);
  if (!user) return res.status(400).send("Invalid email or password.");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password.");

  const token = generateAuthToken(user);
  res.send(token);
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(req);
}

module.exports = router;
