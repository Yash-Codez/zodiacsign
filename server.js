import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { supabase } from 'supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files if dist exists
async function checkDistExists() {
  try {
    await fs.access(DIST_PATH);
    return true;
  } catch {
    return false;
  }
}

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
      if (date > now) throw new Error('Date of birth cannot be in the future');
      if (date < minDate) throw new Error('Date of birth must be after 1900');
      return true;
    }),
];

function calculateZodiacSign(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
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
      if (month === zodiac.startMonth && day >= zodiac.startDay && day <= zodiac.endDay) {
        return zodiac.sign;
      }
    } else {
      if (
        (month === zodiac.startMonth && day >= zodiac.startDay) ||
        (month === zodiac.endMonth && day <= zodiac.endDay)
      ) {
        return zodiac.sign;
      }
    }
  }

  return 'Unknown';
}

// POST /api/zodiac - Store in Supabase
app.post('/api/zodiac', zodiacValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, dateOfBirth } = req.body;
    const birthDate = new Date(dateOfBirth);
    const zodiacSign = calculateZodiacSign(birthDate);

    const { data, error } = await supabase
      .from('zodiac_entries')
      .insert([{ name: name.trim(), dob: dateOfBirth, zodiac: zodiacSign }]);

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ success: false, message: 'Database insert error' });
    }

    res.json({
      success: true,
      data: {
        zodiacSign,
        message: `Hello ${name}! Your zodiac sign is ${zodiacSign}.`
      }
    });
  } catch (error) {
    console.error('Error processing zodiac request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/recent - Fetch last 10 entries from Supabase
app.get('/api/recent', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('zodiac_entries')
      .select('id, name, zodiac, dob')
      .order('id', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ success: false, message: 'Database fetch error' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching recent entries:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Serve React app if dist exists
app.get('*', async (req, res) => {
  distExists = await checkDistExists();
  if (distExists) {
    try {
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      await fs.access(indexPath);
      res.sendFile(indexPath);
    } catch (error) {
      console.error('Error serving index.html:', error);
      res.status(404).json({ success: false, message: 'Frontend not built properly. Run "npm run build" first.' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Frontend not built. Run "npm run build" first, or use "npm run dev".' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
