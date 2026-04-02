# 🔥 Calorie & Protein Tracker

A full-stack application for tracking daily calorie and protein intake with a smart TDEE calculator. Using a ChatGPT-like interface, users can log meals and exercises effortlessly, and get real-time feedback on their nutritional goals.

## Features

- **TDEE Calculator**: Automatically calculates your Total Daily Energy Expenditure based on:
  - Age, Weight, Height, Gender
  - Activity Level (5 specific tiers: Sedentary → Extra Active)
  - Uses Mifflin-St Jeor formula for accuracy

- **Smart Meal Logging**: Chat-interface meal tracking with:
  - Natural language understanding for food recognition
  - Automatic calorie and protein lookup from food database
  - Quick-add common foods
  - Real-time macro calculation

- **Exercise Tracking**: 
  - Log exercises with duration and intensity
  - Auto-calculate calories burned (adjusted for body weight)
  - Exercises add to your daily TDEE allowance

- **Dashboard**:
  - Daily calorie and protein tracking
  - Visual progress bars
  - Remaining calories/protein goals
  - Adjusted TDEE (base + exercises)
  - Summary of meals and exercises

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for data persistence
- **Mongoose** ODM for database schema

### Frontend
- **React 18** with hooks
- **Axios** for API calls
- **CSS3** with gradients and animations
- **LocalStorage** for session management

## Project Structure

```
cal-app/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Meal.js
│   │   └── Exercise.js
│   ├── routes/
│   │   ├── users.js
│   │   ├── meals.js
│   │   ├── exercises.js
│   │   └── nutrition.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Onboarding.js
    │   │   ├── Dashboard.js
    │   │   ├── MealLogger.js
    │   │   ├── ExerciseLogger.js
    │   │   └── *.css
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/calorie-tracker
PORT=5000
```

5. Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will open at `http://localhost:3000`

## API Endpoints

### Users
- `POST /api/users` - Create new user with TDEE calculation
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user data and recalculate TDEE

### Meals
- `POST /api/meals` - Log a meal
- `GET /api/meals/today/:userId` - Get today's meals and totals
- `GET /api/meals/:userId` - Get meals by date range
- `DELETE /api/meals/:mealId` - Delete a meal

### Exercises
- `POST /api/exercises` - Log an exercise
- `GET /api/exercises/today/:userId` - Get today's exercises and total calories burned
- `GET /api/exercises/:userId` - Get exercises by date range
- `DELETE /api/exercises/:exerciseId` - Delete an exercise

## Usage

### Step 1: Onboarding
When you first open the app, you'll be guided through a 3-step setup:
1. **Basic Info**: Name, Age, Gender
2. **Measurements**: Weight (kg), Height (cm)
3. **Activity Level**: Select your typical activity level (5 options)

Your TDEE and protein targets will be automatically calculated!

### Step 2: Track Meals
- Click "Log Meal" tab
- Type what you ate naturally (e.g., "1 chicken breast", "2 slices bread")
- The app recognizes the food and shows calories/protein
- Confirm to add to your daily intake

### Step 3: Track Exercises
- Click "Log Exercise" tab
- Describe your workout (e.g., "30 minute run", "intense gym")
- App calculates calories burned based on duration and intensity
- Confirm to add and increase your daily calorie allowance

### Step 4: Monitor Dashboard
- View real-time progress toward your daily goals
- See remaining calories and protein
- Track adjusted TDEE (base + exercises)

## Features in Detail

### TDEE Calculation
Uses the **Mifflin-St Jeor formula**:
- **For Men**: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
- **For Women**: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
- TDEE = BMR × Activity Multiplier

Activity Multipliers:
- Sedentary (1.2): Little or no exercise, desk job
- Lightly Active (1.375): Exercise 1-3 days/week
- Moderately Active (1.55): Exercise 3-5 days/week
- Very Active (1.725): Exercise 6-7 days/week
- Extra Active (1.9): Physical job or 2x daily training

### Protein Targets
- Automatically set to 1.8g per kg of body weight
- Suitable for most fitness goals (muscle building & maintenance)
- Adjustable in user profile

### Calorie Burn Estimation
- Based on exercise type, duration, and intensity
- Adjusted for user's body weight
- Estimates: Running (8-15 cal/min), Cycling (6-14), Swimming (7-16), Yoga (2-6)

## Future Enhancements

- [ ] Food database integration (USDA, Edamam API)
- [ ] Barcode scanning for accurate nutrition data
- [ ] Weekly/Monthly statistics and trends
- [ ] Goal setting (weight loss, muscle gain)
- [ ] Social features (share progress, friend challenges)
- [ ] Mobile app (React Native)
- [ ] Advanced nutrition tracking (vitamins, minerals)
- [ ] Meal plans and recipes
- [ ] Integration with fitness trackers (Apple Health, Google Fit)

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/calorie-tracker
PORT=5000
NODE_ENV=development
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally or update MONGODB_URI with your remote instance
- Check if port 27017 is available

### Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check CORS is enabled (it is by default)
- Clear browser cache and restart

### Calories Seems Wrong
- Calorie burn estimates are approximate and vary by fitness level
- Consider consulting a nutritionist for personalized advice

## Contributing

Feel free to fork, create issues, and submit pull requests!

## License

MIT

## Support

For issues or questions, please create an issue on GitHub.

---

**Built with ❤️ for health-conscious developers**
