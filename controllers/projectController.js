const Project = require('../models/Project');

// Get all projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('folders');
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Create a new project
const createProject = async (req, res) => {
  const { name} = req.body;
  

  if (!name ) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  try {
    const newProject = new Project({ name });
    await newProject.save();
    res.status(201).json({ success: true, data: newProject });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Update an existing project
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    project.name = name || project.name;
    await project.save();

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Delete an existing project
const deleteProject = async (req, res) => {
 

  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted successfully" });
    
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      };
   

   

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject
};
