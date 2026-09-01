import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error && error.name === "ZodError") {
      const issues = error.issues || error.errors || [];
      const errorMessage = issues.length > 0 ? issues.map((err) => err.message).join(", ") : "Validation Error";
      return next(new ApiError(400, errorMessage));
    }
    return next(new ApiError(500, "Internal Server Error"));
  }
};
