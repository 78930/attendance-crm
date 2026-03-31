function generateEmployeeCode(index = 1) {
  return `EMP${String(index).padStart(4, '0')}`;
}

module.exports = generateEmployeeCode;
