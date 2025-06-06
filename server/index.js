import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/poetry-platform';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar_url: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Poem Schema
const poemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  image_url: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes_count: { type: Number, default: 0 },
  comments_count: { type: Number, default: 0 },
  is_featured: { type: Boolean, default: false }
}, { timestamps: true });

const Poem = mongoose.model('Poem', poemSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  poem: { type: mongoose.Schema.Types.ObjectId, ref: 'Poem', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar_url: user.avatar_url,
        created_at: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar_url: user.avatar_url,
        created_at: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar_url: user.avatar_url,
      created_at: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Poem Routes
app.get('/api/poems', async (req, res) => {
  try {
    const { category, search, sort = 'recent', limit = 20, page = 1 } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortQuery = {};
    switch (sort) {
      case 'popular':
        sortQuery = { likes_count: -1 };
        break;
      case 'commented':
        sortQuery = { comments_count: -1 };
        break;
      case 'alphabetical':
        sortQuery = { title: 1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const poems = await Poem.find(query)
      .populate('author', 'username')
      .sort(sortQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(poems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/poems/featured', async (req, res) => {
  try {
    const poems = await Poem.find({ is_featured: true })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(3);
    res.json(poems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/poems/trending', async (req, res) => {
  try {
    const poems = await Poem.find()
      .populate('author', 'username')
      .sort({ likes_count: -1 })
      .limit(6);
    res.json(poems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/poems/:id', async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id)
      .populate('author', 'username avatar_url');
    
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }
    
    res.json(poem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/poems', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    const poem = new Poem({
      title,
      content,
      author: req.user.userId,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      image_url: req.file ? `/uploads/${req.file.filename}` : ''
    });

    await poem.save();
    await poem.populate('author', 'username');
    
    res.status(201).json(poem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/poems/:id', authenticateToken, async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id);
    
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }
    
    if (poem.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, content, category, tags } = req.body;
    
    poem.title = title || poem.title;
    poem.content = content || poem.content;
    poem.category = category || poem.category;
    poem.tags = tags ? tags.split(',').map(tag => tag.trim()) : poem.tags;
    
    await poem.save();
    await poem.populate('author', 'username');
    
    res.json(poem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/poems/:id', authenticateToken, async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id);
    
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }
    
    if (poem.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Poem.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ poem: req.params.id });
    
    res.json({ message: 'Poem deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like Routes
app.post('/api/poems/:id/like', authenticateToken, async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id);
    
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }

    const userId = req.user.userId;
    const isLiked = poem.likes.includes(userId);

    if (isLiked) {
      poem.likes.pull(userId);
      poem.likes_count = Math.max(0, poem.likes_count - 1);
    } else {
      poem.likes.push(userId);
      poem.likes_count += 1;
    }

    await poem.save();
    
    res.json({ 
      liked: !isLiked, 
      likes_count: poem.likes_count 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/poems/:id/like-status', authenticateToken, async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id);
    
    if (!poem) {
      return res.status(404).json({ error: 'Poem not found' });
    }

    const isLiked = poem.likes.includes(req.user.userId);
    
    res.json({ liked: isLiked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comment Routes
app.get('/api/poems/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ poem: req.params.id, parent: null })
      .populate('author', 'username avatar_url')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username avatar_url'
        }
      })
      .sort({ createdAt: 1 });
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/poems/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    
    const comment = new Comment({
      poem: req.params.id,
      author: req.user.userId,
      content,
      parent: parentId || null
    });

    await comment.save();
    await comment.populate('author', 'username avatar_url');

    // Update parent comment if this is a reply
    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, {
        $push: { replies: comment._id }
      });
    }

    // Update poem comments count
    await Poem.findByIdAndUpdate(req.params.id, {
      $inc: { comments_count: 1 }
    });
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Routes
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar_url: user.avatar_url,
      created_at: user.createdAt,
      followers_count: user.followers.length,
      following_count: user.following.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id/poems', async (req, res) => {
  try {
    const poems = await Poem.find({ author: req.params.id })
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    
    res.json(poems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const totalPoems = await Poem.countDocuments({ author: userId });
    
    const poems = await Poem.find({ author: userId });
    const totalLikes = poems.reduce((sum, poem) => sum + poem.likes_count, 0);
    const totalComments = poems.reduce((sum, poem) => sum + poem.comments_count, 0);
    
    res.json({
      totalPoems,
      totalLikes,
      totalComments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Follow Routes
app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ following: !isFollowing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});