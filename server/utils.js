const NETWORK_HOSPITALS = [
  'Care Hospital',
  'Apollo Hospital',
  'Yashoda Hospital',
  'AIG Hospitals',
  'Fortis Hospital',
  'Max Hospital'
];

const BLOOD_COMPAT = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

function normalizeBlood(bg) {
  return String(bg || '').toUpperCase().replace(/\s/g, '');
}

function isBloodCompatible(donorBlood, recipientBlood) {
  const donor = normalizeBlood(donorBlood);
  const recipient = normalizeBlood(recipientBlood);
  const compatible = BLOOD_COMPAT[donor];
  return compatible ? compatible.includes(recipient) : donor === recipient;
}

function isOrganMatch(organ, request) {
  if (organ.status !== 'Available') return false;
  if (organ.organ_type.toLowerCase() !== request.organ.toLowerCase()) return false;
  return isBloodCompatible(organ.blood_group, request.blood);
}

function generateVerificationCode() {
  return `ORE-${Math.floor(100000 + Math.random() * 900000)}`;
}

module.exports = {
  NETWORK_HOSPITALS,
  isBloodCompatible,
  isOrganMatch,
  generateVerificationCode,
  normalizeBlood
};
