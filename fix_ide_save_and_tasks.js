// =====================================================
// FIX IDE SAVE AND TASK SYSTEM
// This file contains fixes for both save functionality and task management
// =====================================================

// 1. FIXED SAVE FUNCTIONALITY
// Replace your existing handleSave function with this:

const handleSave = async () => {
  console.log('[SAVE] 🚀 Save button clicked!');
  
  try {
    // Get the currently selected file
    const selectedFile = getCurrentSelectedFile(); // You need to implement this
    if (!selectedFile) {
      console.log('[SAVE] ❌ No file selected');
      toast.error('No file selected to save');
      return;
    }

    console.log('[SAVE] Selected file:', selectedFile.name);
    
    // Get the current content from Monaco editor
    const currentContent = getMonacoEditorContent(); // You need to implement this
    if (currentContent === null || currentContent === undefined) {
      console.log('[SAVE] ❌ No content to save');
      toast.error('No content to save');
      return;
    }

    // Check if file has actually changed
    if (currentContent === selectedFile.originalContent) {
      console.log('[SAVE] ℹ️ File unchanged, skipping save');
      toast.info('File is already up to date');
      return;
    }

    // Save using Electron API
    if (window.electronAPI && window.electronAPI.fs) {
      const filePath = selectedFile.path;
      
      // Write file content
      const saveResult = await window.electronAPI.fs.writeFile(filePath, currentContent);
      
      if (saveResult.success) {
        console.log('[SAVE] ✅ File saved successfully');
        
        // Update the file in your state
        updateFileInState(selectedFile.id, {
          content: currentContent,
          originalContent: currentContent,
          isModified: false,
          lastSaved: new Date().toISOString()
        });
        
        // Show success toast
        toast.success(`File "${selectedFile.name}" saved successfully!`);
        
        // Update unsaved files count
        updateUnsavedFilesCount();
        
      } else {
        console.error('[SAVE] ❌ Save failed:', saveResult.error);
        toast.error(`Failed to save file: ${saveResult.error}`);
      }
    } else {
      console.error('[SAVE] ❌ Electron API not available');
      toast.error('Save functionality not available');
    }
    
  } catch (error) {
    console.error('[SAVE] ❌ Exception during save:', error);
    toast.error(`Save failed: ${error.message}`);
  }
};

// 2. HELPER FUNCTIONS YOU NEED TO IMPLEMENT

const getCurrentSelectedFile = () => {
  // Return the currently selected file object
  // This should include: { id, name, path, content, originalContent, isModified }
  return window.currentSelectedFile || null;
};

const getMonacoEditorContent = () => {
  // Get content from Monaco editor
  if (window.monacoEditor) {
    return window.monacoEditor.getValue();
  }
  return null;
};

const updateFileInState = (fileId, updates) => {
  // Update the file in your React state
  // This depends on your state management structure
  setFiles(prevFiles => 
    prevFiles.map(file => 
      file.id === fileId 
        ? { ...file, ...updates }
        : file
    )
  );
};

const updateUnsavedFilesCount = () => {
  // Recalculate and update unsaved files count
  const unsavedCount = files.filter(file => file.isModified).length;
  setUnsavedFilesCount(unsavedCount);
};

// 3. FIXED TASK SYSTEM
// Replace your task loading logic with this:

const loadProjectTasks = async (projectName, projectPath) => {
  console.log('[TASKS] 🔍 Loading tasks for project:', projectName);
  
  try {
    // First try to load from database (if you have one)
    const databaseTasks = await loadTasksFromDatabase(projectName);
    if (databaseTasks && databaseTasks.length > 0) {
      console.log('[TASKS] ✅ Loaded tasks from database:', databaseTasks.length);
      setProjectTasks(databaseTasks);
      return;
    }

    // Try to load from project's tasks.json file
    const tasksFilePath = `${projectPath}/tasks.json`;
    console.log('[TASKS] 🔄 Attempting to load from:', tasksFilePath);
    
    if (window.electronAPI && window.electronAPI.fs) {
      const fileResult = await window.electronAPI.fs.readFile(tasksFilePath);
      
      if (fileResult.success) {
        try {
          const tasksData = JSON.parse(fileResult.content);
          console.log('[TASKS] ✅ Loaded tasks from file:', tasksData);
          setProjectTasks(tasksData.tasks || []);
          return;
        } catch (parseError) {
          console.error('[TASKS] ❌ Failed to parse tasks.json:', parseError);
        }
      }
    }

    // Generate default tasks based on stack
    console.log('[TASKS] 🔄 Generating default tasks for stack');
    const defaultTasks = generateDefaultTasks(projectName, getProjectStack(projectPath));
    
    // Save default tasks to file
    await saveTasksToFile(projectPath, defaultTasks);
    
    console.log('[TASKS] ✅ Generated and saved default tasks:', defaultTasks.length);
    setProjectTasks(defaultTasks);
    
  } catch (error) {
    console.error('[TASKS] ❌ Error loading tasks:', error);
    
    // Fallback to empty tasks
    setProjectTasks([]);
    toast.error('Failed to load project tasks');
  }
};

const generateDefaultTasks = (projectName, stackName) => {
  const taskTemplates = {
    'React': [
      {
        id: 'react-setup-1',
        title: 'Setup React Project Structure',
        description: 'Create a well-organized React project with proper folder structure',
        instructions: 'Set up components, pages, hooks, and utils folders',
        category: 'Setup',
        priority: 'high',
        order: 1
      },
      {
        id: 'react-components-2',
        title: 'Create Core Components',
        description: 'Build reusable React components',
        instructions: 'Create Header, Footer, Layout, and common UI components',
        category: 'Development',
        priority: 'medium',
        order: 2
      }
    ],
    'Node.js': [
      {
        id: 'node-setup-1',
        title: 'Initialize Node.js Project',
        description: 'Set up Node.js project with proper package.json',
        instructions: 'Initialize npm project and install essential dependencies',
        category: 'Setup',
        priority: 'high',
        order: 1
      }
    ],
    'Python': [
      {
        id: 'python-setup-1',
        title: 'Setup Python Environment',
        description: 'Create virtual environment and install dependencies',
        instructions: 'Set up virtual environment and requirements.txt',
        category: 'Setup',
        priority: 'high',
        order: 1
      }
    ],
    'Bash': [
      {
        id: 'bash-setup-1',
        title: 'Create Main Script',
        description: 'Set up the main bash script with proper structure',
        instructions: 'Create main.sh with error handling and logging',
        category: 'Setup',
        priority: 'high',
        order: 1
      },
      {
        id: 'bash-functions-2',
        title: 'Add Utility Functions',
        description: 'Create reusable bash functions',
        instructions: 'Add functions for common operations and error handling',
        category: 'Development',
        priority: 'medium',
        order: 2
      }
    ]
  };

  const tasks = taskTemplates[stackName] || taskTemplates['Bash'];
  
  return {
    projectName,
    stackName,
    projectId: null,
    createdAt: new Date().toISOString(),
    tasks: tasks.map(task => ({
      ...task,
      completed: false,
      createdAt: new Date().toISOString()
    }))
  };
};

const saveTasksToFile = async (projectPath, tasksData) => {
  try {
    const tasksFilePath = `${projectPath}/tasks.json`;
    const tasksJson = JSON.stringify(tasksData, null, 2);
    
    if (window.electronAPI && window.electronAPI.fs) {
      const result = await window.electronAPI.fs.writeFile(tasksFilePath, tasksJson);
      if (result.success) {
        console.log('[TASKS] ✅ Tasks saved to file');
      } else {
        console.error('[TASKS] ❌ Failed to save tasks:', result.error);
      }
    }
  } catch (error) {
    console.error('[TASKS] ❌ Exception saving tasks:', error);
  }
};

const loadTasksFromDatabase = async (projectName) => {
  // Implement database loading if you have a backend
  // For now, return null to skip database loading
  return null;
};

const getProjectStack = (projectPath) => {
  // Determine stack from project path or files
  if (projectPath.includes('/react/')) return 'React';
  if (projectPath.includes('/node/')) return 'Node.js';
  if (projectPath.includes('/python/')) return 'Python';
  if (projectPath.includes('/bash/')) return 'Bash';
  return 'Bash'; // Default
};

// 4. KEYBOARD SHORTCUTS FOR SAVE
// Add this to your component's useEffect:

useEffect(() => {
  const handleKeyDown = (event) => {
    // Ctrl+S or Cmd+S to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      handleSave();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, []);

// 5. AUTO-SAVE FUNCTIONALITY
// Add this to automatically save files:

useEffect(() => {
  let autoSaveTimer;
  
  const startAutoSave = () => {
    autoSaveTimer = setInterval(() => {
      const unsavedFiles = files.filter(file => file.isModified);
      if (unsavedFiles.length > 0) {
        console.log('[AUTO-SAVE] Saving', unsavedFiles.length, 'modified files');
        unsavedFiles.forEach(file => {
          // Auto-save each modified file
          saveFileContent(file);
        });
      }
    }, 30000); // Auto-save every 30 seconds
  };

  startAutoSave();
  
  return () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
    }
  };
}, [files]);

// Export the functions you need
export {
  handleSave,
  loadProjectTasks,
  generateDefaultTasks,
  saveTasksToFile
};
