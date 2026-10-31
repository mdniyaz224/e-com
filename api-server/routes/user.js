const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const userFilePath = path.join(__dirname, '../data/user.json');

function loadUserData() {
  try {
    if (fs.existsSync(userFilePath)) {
      const data = JSON.parse(fs.readFileSync(userFilePath, 'utf-8'));
      return data;
    }
  } catch (err) {
    console.error('Failed to read user.json:', err);
  }
  return require('../data/user.json');
}

let currentUser = loadUserData();

// Ensure default fallback arrays
if (!Array.isArray(currentUser.addresses) || currentUser.addresses.length === 0) {
  currentUser.addresses = [
    {
      id: 1,
      label: "HOME",
      name: currentUser.name || "Rahul Sharma",
      phone: currentUser.phone || "+91 98765 43210",
      pincode: "560034",
      address: "Flat 402, Lotus Greens, 4th Cross, Koramangala",
      city: "Bengaluru",
      isDefault: true
    },
    {
      id: 2,
      label: "WORK",
      name: currentUser.name || "Rahul Sharma",
      phone: currentUser.phone || "+91 98765 43210",
      pincode: "560103",
      address: "Prestige Tech Park, Outer Ring Road, Marathahalli",
      city: "Bengaluru",
      isDefault: false
    }
  ];
}

if (!Array.isArray(currentUser.savedCards) || currentUser.savedCards.length === 0) {
  currentUser.savedCards = [
    {
      id: 1,
      bank: "HDFC Bank",
      cardType: "Credit Card",
      last4: "4921",
      holder: currentUser.name || "Rahul Sharma",
      expiry: "09/28"
    },
    {
      id: 2,
      bank: "Axis Bank",
      cardType: "PulseKart Co-branded",
      last4: "8832",
      holder: currentUser.name || "Rahul Sharma",
      expiry: "11/27"
    }
  ];
}

if (!currentUser.gender) {
  currentUser.gender = "Male";
}

function saveUserToFile() {
  try {
    fs.writeFileSync(userFilePath, JSON.stringify(currentUser, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write user.json:', err);
  }
}

// GET user profile
router.get('/', (req, res) => {
  res.json(currentUser);
});

// PUT update user profile details
router.put('/', (req, res) => {
  try {
    const { name, email, phone, gender } = req.body;
    
    if (name !== undefined && name !== null) {
      currentUser.name = String(name).trim();
    }
    if (email !== undefined && email !== null) {
      currentUser.email = String(email).trim();
    }
    if (phone !== undefined && phone !== null) {
      currentUser.phone = String(phone).trim();
    }
    if (gender !== undefined && gender !== null) {
      currentUser.gender = String(gender).trim();
    }

    saveUserToFile();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: currentUser
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ success: false, error: 'Internal server error updating profile' });
  }
});

// POST add address
router.post('/addresses', (req, res) => {
  try {
    const { label, name, phone, pincode, address, city } = req.body;
    if (!name || !address || !pincode) {
      return res.status(400).json({ error: "Name, address, and pincode are required" });
    }

    const newAddress = {
      id: Date.now(),
      label: (label || 'HOME').toUpperCase(),
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : currentUser.phone,
      pincode: String(pincode).trim(),
      address: String(address).trim(),
      city: (city || 'Bengaluru').trim(),
      isDefault: !currentUser.addresses || currentUser.addresses.length === 0
    };

    if (!Array.isArray(currentUser.addresses)) {
      currentUser.addresses = [];
    }
    currentUser.addresses.push(newAddress);
    saveUserToFile();

    res.status(201).json({ success: true, addresses: currentUser.addresses });
  } catch (err) {
    console.error('Error adding address:', err);
    res.status(500).json({ success: false, error: 'Internal server error adding address' });
  }
});

// DELETE address
router.delete('/addresses/:id', (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    currentUser.addresses = (currentUser.addresses || []).filter(a => a.id !== targetId);
    saveUserToFile();

    res.json({ success: true, addresses: currentUser.addresses });
  } catch (err) {
    console.error('Error deleting address:', err);
    res.status(500).json({ success: false, error: 'Internal server error deleting address' });
  }
});

module.exports = router;
