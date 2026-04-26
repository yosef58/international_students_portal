const pagination = async (model, req, filter = {}) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await model.countDocuments(filter);

  return {
    skip,
    limit,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export default pagination;