const getSoftDeleteFilter = () => {
  return { deletedAt: null };
};

module.exports = {
  getSoftDeleteFilter
};
