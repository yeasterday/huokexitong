function getOrgScope(user = {}) {
  return {
    orgId: user.orgId || user._id || '',
    orgName: user.orgName || user.name || '默认校区',
  };
}

module.exports = {
  getOrgScope,
};
