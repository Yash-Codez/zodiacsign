import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');
const DIST_PATH = path.join(__dirname, 'dist');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting - Allow 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Check if dist directory exists and serve static files only if it does
async function checkDistExists() {
  try {
    await fs.access(DIST_PATH);
    return true;
  } catch {
    return false;
  }
}

// Conditionally serve static files
let distExists = await checkDistExists();
if (distExists) {
  app.use(express.static('dist'));
}

// Input validation rules
const zodiacValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name must contain only letters, spaces, hyphens, and apostrophes'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const minDate = new Date('1900-01-01');
      
      if (date > now) {
        throw new Error('Date of birth cannot be in the future');
      }
      if (date < minDate) {
        throw new Error('Date of birth must be after 1900');
      }
      return true;
    }),
];

/**
 * Calculate zodiac sign based on birth date
 * @param {Date} date - The birth date
 * @returns {string} - The zodiac sign
 */
function calculateZodiacSign(date) {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  
  // Zodiac sign date ranges
  const zodiacSigns = [
    { sign: 'Capricorn', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
    { sign: 'Aquarius', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
    { sign: 'Pisces', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
    { sign: 'Aries', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
    { sign: 'Taurus', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
    { sign: 'Gemini', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
    { sign: 'Cancer', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
    { sign: 'Leo', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
    { sign: 'Virgo', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
    { sign: 'Libra', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
    { sign: 'Scorpio', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
    { sign: 'Sagittarius', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  ];
  
  for (const zodiac of zodiacSigns) {
    if (zodiac.startMonth === zodiac.endMonth) {
      // Same month range
      if (month === zodiac.startMonth && day >= zodiac.startDay && day <= zodiac.endDay) {
        return zodiac.sign;
      }
    } else {
      // Cross-month range
      if (
        (month === zodiac.startMonth && day >= zodiac.startDay) ||
        (month === zodiac.endMonth && day <= zodiac.endDay)
      ) {
        return zodiac.sign;
      }
    }
  }
  
  return 'Unknown'; // Fallback
}

/**
 * Initialize data file if it doesn't exist
 */
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it with empty array
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    console.log('Data file initialized');
  }
}

/**
 * Read data from JSON file
 * @returns {Array} - Array of zodiac entries
 */
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return [];
  }
}

/**
 * Write data to JSON file
 * @param {Array} data - Array of zodiac entries to write
 */
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
    throw new Error('Failed to save data');
  }
}

// API Routes

/**
 * POST /api/zodiac - Calculate and store zodiac sign
 */
app.post('/api/zodiac', zodiacValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, dateOfBirth } = req.body;
    const birthDate = new Date(dateOfBirth);
    const zodiacSign = calculateZodiacSign(birthDate);
    
    // Create entry object
    const entry = {
      id: Date.now(), // Simple ID generation
      name: name.trim(),
      dateOfBirth,
      zodiacSign,
      timestamp: new Date().toISOString(),
    };
    
    // Read existing data
    const existingData = await readData();
    
    // Add new entry to the beginning of the array
    existingData.unshift(entry);
    
    // Keep only the last 100 entries to prevent file from growing too large
    if (existingData.length > 100) {
      existingData.splice(100);
    }
    
    // Write updated data
    await writeData(existingData);
    
    res.json({
      success: true,
      data: {
        zodiacSign,
        message: `Hello ${name}! Your zodiac sign is ${zodiacSign}.`
      }
    });
    
  } catch (error) {
    console.error('Error processing zodiac request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

/**
 * GET /api/recent - Get recent zodiac entries
 */
app.get('/api/recent', async (req, res) => {
  try {
    const data = await readData();
    // Return only the last 10 entries and exclude sensitive data if needed
    const recentEntries = data.slice(0, 10).map(entry => ({
      id: entry.id,
      name: entry.name,
      zodiacSign: entry.zodiacSign,
      timestamp: entry.timestamp
    }));
    
    res.json({
      success: true,
      data: recentEntries
    });
    
  } catch (error) {
    console.error('Error fetching recent entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Serve React app for all other routes (SPA) - only if dist exists
app.get('*', async (req, res) => {
  // Re-check if dist exists in case it was built after server started
  distExists = await checkDistExists();
  
  if (distExists) {
    try {
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      // Check if the specific index.html file exists before trying to serve it
      await fs.access(indexPath);
      res.sendFile(indexPath);
    } catch (error) {
      console.error('Error serving index.html:', error);
      res.status(404).json({ 
        success: false, 
        message: 'Frontend not built properly. Run "npm run build" first.' 
      });
    }
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'Frontend not built. Run "npm run build" first, or use "npm run dev" for development.' 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// Initialize data file and start server
async function startServer() {
  try {
    await initializeDataFile();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Data will be stored in: ${DATA_FILE}`);
      if (!distExists) {
        console.log('⚠️  Frontend not built. Use "npm run dev" for development or "npm run build" for production.');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();