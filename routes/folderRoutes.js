const express = require('express');
const { createFolder, getFoldersByProject, updateFolder, deleteFolder } = require('../controllers/folderController');
const router = express.Router();

// Routes
router.post('/', createFolder);              // Create a new folder
router.get('/:projectId', getFoldersByProject); // Get folders by project ID
router.put('/:id', updateFolder);            // Update a folder by ID
router.delete('/:id', deleteFolder);         // Delete a folder by ID

module.exports = router;
