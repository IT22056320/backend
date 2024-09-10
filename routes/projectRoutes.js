const express = require('express');
const { getProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const router = express.Router();

// Routes
router.post('/', createProject);         // Create a new project
router.get('/', getProjects);            // Get all projects
router.put('/:id', updateProject);       // Update a project by ID
router.delete('/:id', deleteProject);    // Delete a project by ID

module.exports = router;
