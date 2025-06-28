# Zodiac Oracle - Modern Zodiac Calculator

A beautiful, secure full-stack web application that calculates zodiac signs based on birth dates and stores user data safely.

## Features

### Frontend
- **Modern UI**: Beautiful cosmic-themed design with glassmorphism effects
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Real-time Validation**: Client-side form validation with user-friendly error messages
- **Smooth Animations**: Subtle animations and transitions for enhanced UX
- **Recent Entries**: Display of recent zodiac calculations

### Backend
- **Secure API**: Express.js server with comprehensive security measures
- **Input Validation**: Server-side validation using express-validator
- **Rate Limiting**: Protection against spam and abuse
- **Data Persistence**: JSON file storage for user entries
- **CORS Protection**: Configured for secure cross-origin requests

### Security Features
- **Helmet.js**: Security headers for protection against common vulnerabilities
- **Input Sanitization**: Prevents XSS and injection attacks
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Data Validation**: Comprehensive validation for names and dates
- **Error Handling**: Secure error responses without sensitive data exposure

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Validation**: express-validator
- **Security**: Helmet.js + CORS + Rate Limiting
- **Icons**: Lucide React
- **Storage**: JSON file system

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Development Mode** (runs both frontend and backend)
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

3. **Production Build**
   ```bash
   npm run build
   ```

## Deployment on Render.com

### Quick Deploy
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use these settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node.js

### Environment Variables (Optional)
- `PORT`: Server port (Render sets this automatically)

### File Structure
```
zodiac-calculator/
├── server.js              # Express.js backend server
├── src/                   # React frontend source
│   ├── App.tsx           # Main React component
│   ├── main.tsx          # React entry point
│   └── index.css         # Tailwind CSS styles
├── dist/                 # Built frontend files
├── data.json            # User data storage (auto-created)
└── package.json         # Dependencies and scripts
```

## API Endpoints

### POST /api/zodiac
Calculate and store zodiac sign
```json
{
  "name": "John Doe",
  "dateOfBirth": "1990-05-15"
}
```

### GET /api/recent
Get recent zodiac calculations (last 10 entries)

## Zodiac Sign Logic

The application calculates zodiac signs based on these date ranges:
- **Aries**: March 21 - April 19
- **Taurus**: April 20 - May 20
- **Gemini**: May 21 - June 20
- **Cancer**: June 21 - July 22
- **Leo**: July 23 - August 22
- **Virgo**: August 23 - September 22
- **Libra**: September 23 - October 22
- **Scorpio**: October 23 - November 21
- **Sagittarius**: November 22 - December 21
- **Capricorn**: December 22 - January 19
- **Aquarius**: January 20 - February 18
- **Pisces**: February 19 - March 20

## Data Storage

User data is stored in `data.json` with the following structure:
```json
[
  {
    "id": 1640995200000,
    "name": "John Doe",
    "dateOfBirth": "1990-05-15",
    "zodiacSign": "Taurus",
    "timestamp": "2023-12-31T12:00:00.000Z"
  }
]
```

## Security Measures

1. **Input Validation**: Names must contain only letters, spaces, hyphens, and apostrophes
2. **Date Validation**: Birth dates must be between 1900 and today
3. **Rate Limiting**: Prevents spam and abuse
4. **XSS Protection**: Input sanitization and CSP headers
5. **CORS Configuration**: Secure cross-origin request handling
6. **Error Handling**: No sensitive data in error responses

## Browser Compatibility

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

MIT License - feel free to use this project for personal or commercial purposes.