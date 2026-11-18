const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.log(error);

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "That value already exists",
      });
    }

    if (error.type === "StripeInvalidRequestError") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment session",
      });
    }

    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : error.message,
    });
  }
};

export default handle;
