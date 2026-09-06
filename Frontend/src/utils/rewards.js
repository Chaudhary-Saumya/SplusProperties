import axios from 'axios';

// Get or generate a persistent device ID for reward uniqueness
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('kp_device_id');
  if (!deviceId) {
    deviceId = 'DEV-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
    localStorage.setItem('kp_device_id', deviceId);
  }
  return deviceId;
};

// Auto-check and claim install bonus if uncollected
export const triggerInstallBonus = async () => {
  const isClaimed = localStorage.getItem('kp_install_bonus_claimed');
  if (isClaimed) return;

  try {
    const deviceId = getDeviceId();
    const res = await axios.post('/api/rewards/claim-install', { deviceId });
    if (res.data.success) {
      localStorage.setItem('kp_install_bonus_claimed', 'true');
    }
  } catch (err) {
    // Silently ignore if already claimed on backend
    if (err.response?.status === 400) {
      localStorage.setItem('kp_install_bonus_claimed', 'true');
    }
  }
};
