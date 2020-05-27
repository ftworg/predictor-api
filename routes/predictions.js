const express = require("express");
const router = express.Router();
// const cache = require("../middlewares/cache");
const Joi = require("@hapi/joi");
const auth = require("../middlewares/auth");
const { runPrediction } = require("../predictor/predictor");

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.message);

  let input = req.body;
  input.model = 1;
  const result = await runPrediction(input);
  if (!result)
    return res.status(500).send("Unable to process. Kindly verify the inputs.");

  res.send(result);
});

function validate(req) {
  const schema = Joi.object({
    criteria: Joi.number().integer().min(0).max(2),
    category: Joi.array().items(
      Joi.object({
        super: Joi.string(),
        sub: Joi.array().items(Joi.string()),
      })
    ),
    branch: Joi.array().items(Joi.number().integer().min(0).max(9)),
    years: Joi.array().items(
      Joi.object({
        year: Joi.number().integer().min(2019).max(2020),
        months: Joi.array().items(
          Joi.object({
            month: Joi.number().integer().min(1).max(12),
            dates: Joi.array().items(Joi.number().integer().min(1).max(31)),
          })
        ),
      })
    ),
  });

  return schema.validate(req);
}

module.exports = router;
