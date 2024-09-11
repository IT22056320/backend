const Folder = require('../models/Folder');
const Project = require('../models/Project');

// Create a new folder
const createFolder = async (req, res) => {
  const { name, projectId } = req.body;

  if (!name || !projectId) {
    return res.status(400).json({ message: 'Folder name and project ID are required' });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const folder = new Folder({ name, project: projectId });
    const savedFolder = await folder.save();

    project.folders.push(savedFolder._id);
    await project.save();

    res.status(201).json({ success: true, folder: savedFolder });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get folders by project
const getFoldersByProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const folders = await Folder.find({ project: projectId });
    res.status(200).json({ success: true, folders });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update folder
const updateFolder = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    folder.name = name || folder.name;
    await folder.save();

    res.status(200).json({ success: true, folder });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete folder
const deleteFolder = async (req, res) => {
  const { id } = req.params; // Folder ID
  const { projectId } = req.body; // Project ID should come from request body

  try {
    // Find the project by projectId
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Filter out the folder with the specified ID from the project's folders
    project.folders = project.folders.filter(folder => folder._id.toString() !== id);

    // Save the updated project
    await project.save();

    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
     

module.exports = {
  createFolder,
  getFoldersByProject,
  updateFolder,
  deleteFolder
};
