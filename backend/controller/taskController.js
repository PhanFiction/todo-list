const Task = require('../models/Task');
const User = require('../models/User');
const verifyToken = require('../utils/verifyToken');
const convertIdToString = require('../utils/idToString');

const cookieExtractor = (req) => {
  const extractedCookie = req.headers.cookie.split(';')[0].split("authToken=")[1];
  return extractedCookie;
}

// returns all tasks that belongs to the user
exports.getAllTasks = async (req, res) => {
  const cookie = cookieExtractor(req);
  const decodedToken = verifyToken(cookie);

  const foundUser = await User.findById(decodedToken.id);
  if (!foundUser) return res.status(401).send({error: 'User not found'});
  
  const foundTasks = await Task.find(decodedToken.id);
  res.status(200).send({data: foundTasks});
};

// return a single task
exports.getSingleTask = async (req, res) => {
  const taskId = req.params.id;
  const foundTask = await Task.findById(taskId);
  res.status(200).send(foundTask);
};

// create a new task
exports.createTask = async (req, res) => {
  const { title, description, priority, dueDate } = req.body;

  const cookie = cookieExtractor(req);
  const decodedToken = verifyToken(cookie);

  const foundUser = await User.findById(decodedToken.id);
  if (!foundUser) return res.status(401).send({error: 'User not found'});

  // create new task
  const newTask = new Task({
    title,
    description,
    creator: foundUser._id,
    priority,
    completed,
    dueDate,
  });
  try {
    const savedTask = await newTask.save();
    const taskStringId = convertIdToString(savedTask._id);
    foundUser.tasks.push(taskStringId);
    await foundUser.save();
    res.status(201).send({success: 'task created', taskId: taskStringId});
  } catch(error) {
    res.status(401).send({error});
  }
};

// update the Task
exports.updateTask = async (req, res) => {
  const { title, description, priority, completed, dueDate } = req.body;
  const taskId = req.params.id;
  const foundTask = await Task.findById(taskId);

  if(!foundTask) return res.status(401).send({'Task error': 'Task not found'});

  const cookie = cookieExtractor(req);
  const decodedToken = verifyToken(cookie);

  const foundUser = await User.findById(decodedToken.id);
  if(!foundUser) return res.status(401).send({error: 'User not found'});
  if(!decodedToken) return res.status(401).send({error: 'Not authorized'});
  if(foundPin.creator != decodedToken.id) return res.status(401).send({error: 'Not authorized'});

  try{
    foundTask.title = title || foundTask.title;
    foundTask.description = description || foundTask.description;
    foundTask.priority = priority;
    foundTask.completed = completed;
    foundTask.dueDate = dueDate;

    await foundTask.save();
    res.status(200).json({ success: 'Task has been updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTask = async (req, res) => {
  const taskId = req.params.id;

  try {
    const foundTask = await Task.findById(taskId);

    if (!foundTask) return res.status(404).json({ error: 'Task not found' });

    const cookie = cookieExtractor(req);
    const decodedToken = verifyToken(cookie);
    const foundUser = await User.findById(decodedToken.id);

    if (!decodedToken) return res.status(403).json({ error: 'Not authorized' });
    if (!foundUser) return res.status(403).json({ error: 'User not found' });
    if (foundTask.creator.toString() !== decodedToken.id) return res.status(403).json({ error: 'Not authorized' });
    
    // Delete the task from the database
    await Task.findByIdAndDelete(taskId);

    // Update the user's tasks by removing the deleted task's ID
    foundUser.tasks = foundUser.tasks.filter((taskId) => taskId.toString() !== taskId);

    // Save the user
    await foundUser.save();

    res.status(200).json({ success: 'Task deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
